import { SCAN_LOGGER } from "./utils/scanLogger";
import ScanDatabaseSync, { ScanDatabaseTransaction } from "../../db/ScanDatabaseSync";
import { WebCrawlResult } from "@/engine/WebCrawlEngine";
import { SiteCrawlResult } from "@/engine/SiteCrawler";
import { SiteScrapeResult } from "@/engine/SiteScraper";
import { WebDataCategory } from "@/engine/scraping/categories";
import { ReservedPathLabel } from "../../engine/sites/paths";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { sitecrawls } from "../../db/schema";
import { sanitizeLinksIntoURLs } from "@/engine/utils/sanitizeLinks";

const log = SCAN_LOGGER.getSubLogger({ name: "DataProcessor" });

export type WebScanDataIDs = {
    crawlIDs: number[];
    scrapeIDs: number[];
    errorIDs: number[];
    linkIDs: number[];
};

type PageDataValueProcessor = (
    pageResult: SiteScrapeResult,
    category: WebDataCategory,
) => string | undefined;

export default class ScanDataProcessor {
    private scanDB: ScanDatabaseSync;

    private crawlIDs: number[] = [];
    private scrapeIDs: number[] = [];
    private errorIDs: number[] = [];
    private linkIDs: number[] = [];

    // Data processing
    private topValueProcessor: PageDataValueProcessor;
    private groupValueProcessor: PageDataValueProcessor;

    constructor(
        webDB: ScanDatabaseSync,
        topValueProcessor?: PageDataValueProcessor,
        groupValueProcessor?: PageDataValueProcessor,
    ) {
        this.scanDB = webDB;
        this.topValueProcessor = topValueProcessor ?? getFirstCategoryValue;
        this.groupValueProcessor = groupValueProcessor ?? stringifyValueGroup;
    }

    init() {
        this.crawlIDs = [];
        this.scrapeIDs = [];
        this.errorIDs = [];
        this.linkIDs = [];
    }

    getDataIDs(): WebScanDataIDs {
        return {
            crawlIDs: this.crawlIDs,
            scrapeIDs: this.scrapeIDs,
            errorIDs: this.errorIDs,
            linkIDs: this.linkIDs,
        };
    }

    processSiteCrawlResult(
        scanID: number,
        domainID: number,
        siteCrawlResult: SiteCrawlResult,
    ): void {
        this.scanDB.orm.transaction((tx) => {
            const { crawlID } = this.scanDB.createSiteCrawl(
                {
                    scanID,
                    domainID,
                    startTime: siteCrawlResult.startTime,
                    endTime: siteCrawlResult.endTime,
                },
                tx,
            );

            this.crawlIDs.push(crawlID);

            // Store "successful" pages
            for (const pageResult of siteCrawlResult.pageResults) {
                try {
                    this.processSitePageResult(
                        tx,
                        crawlID,
                        domainID,
                        pageResult,
                    );
                } catch (error) {
                    log.error(
                        `Error while processing page result: ${(error as Error).message}`,
                    );
                }
            }

            // Store unvisited unvisitedLinks (doesn't include path labels by nature of scraping)
            const unvisitedURLs = sanitizeLinksIntoURLs(
                siteCrawlResult.unvisitedLinks,
            ).validURLs;

            log.debug(
                `(Domain ${domainID}) Adding ${unvisitedURLs.length} unvisited URLs to linkpaths... `,
            );

            for (const unvisitedURL of unvisitedURLs) {
                try {
                    const linkID = this.scanDB.createLinkPathname(
                        {
                            domainID,
                            pathname: unvisitedURL.pathname,
                        },
                        tx,
                    );

                    if (linkID) {
                        this.linkIDs.push(linkID);
                        log.debug(
                            `(Domain ${domainID}) Added 1 unvisited URL to linkpaths... `,
                        );
                    }
                } catch (error) {
                    log.error(
                        `Error while adding unvisited URL: ${(error as Error).message}`,
                    );
                }
            }

            // Store errors

            for (const {
                link,
                errorMsg,
                visitStartTime,
                visitEndTime,
                pathLabel,
            } of siteCrawlResult.errors) {
                try {
                    const linkID = this.scanDB.createLinkPathname(
                        {
                            domainID,
                            pathname: new URL(link).pathname,
                            pathlabel: pathLabel,
                        },
                        tx,
                    );

                    this.linkIDs.push(linkID);

                    const pageerror = this.scanDB.createPageError(
                        {
                            crawlID,
                            linkID,
                            blob: errorMsg,
                            time: visitEndTime,
                        },
                        tx,
                    );

                    this.errorIDs.push(pageerror.errorID);
                } catch (error) {
                    log.warn(
                        `Failed to add pagerror: ${(error as Error).message}}`,
                    );
                }
            }
        });
    }

    private processSitePageResult(
        tx: ScanDatabaseTransaction,
        siteCrawlID: number,
        domainID: number,
        sitePageResult: SiteScrapeResult,
    ): void {
        // Store page's link
        const linkID = this.scanDB.createLinkPathname(
            {
                domainID,
                pathname: new URL(sitePageResult.pageLink).pathname,
                pathlabel: sitePageResult.pathLabel,
            },
            tx,
        );

        this.linkIDs.push(linkID);

        // Store page's scraped data

        const r = sitePageResult;
        const pagescrape = this.scanDB.createPageScrape(
            {
                crawlID: siteCrawlID,
                linkID,
                startTime: r.startTime,
                endTime: r.endTime,
                numLinks: getNumLinks(r),
                textbody: this.groupValueProcessor(r, WebDataCategory.TextBody),
                title: this.topValueProcessor(r, WebDataCategory.Title),
                author: this.topValueProcessor(r, WebDataCategory.Author),
                datepub: this.topValueProcessor(r, WebDataCategory.DatePub),
                tags: this.groupValueProcessor(r, WebDataCategory.Tag),
                descriptions: this.groupValueProcessor(
                    r,
                    WebDataCategory.Description,
                ),
                comments: this.groupValueProcessor(r, WebDataCategory.Comment),
                media: this.groupValueProcessor(r, WebDataCategory.Media),
                captions: this.groupValueProcessor(r, WebDataCategory.Caption),
            },
            tx,
        );

        this.scrapeIDs.push(pagescrape.scrapeID);

        // Store page's possible sitemap unvisitedLinks
        if (sitePageResult.sitemapIndexedLinks) {
            this.processSitemapIndexedLinks(
                domainID,
                sitePageResult.sitemapIndexedLinks,
                tx,
            );
        }

        if (sitePageResult.sitemapListedLinks) {
            this.processSitemapListedLinks(
                domainID,
                sitePageResult.sitemapListedLinks,
                tx,
            );
        }
    }

    private processSitemapIndexedLinks(
        domainID: number,
        unvisitedLinks: string[],
        tx: ScanDatabaseTransaction,
    ) {
        const indexedURLs = sanitizeLinksIntoURLs(unvisitedLinks).validURLs;
        log.debug(
            `(Domain ${domainID}) Adding ${indexedURLs.length} indexed sitemap URLs to linkpaths...`,
        );

        for (const url of indexedURLs) {
            const linkID = this.scanDB.createLinkPathname(
                {
                    domainID,
                    pathname: new URL(url).pathname,
                    pathlabel: ReservedPathLabel.SITEMAPLIST,
                    // Indexed sitemap unvisitedLinks are lists (Indexes are the scrape itself)
                },
                tx,
            );

            this.linkIDs.push(linkID);
        }
    }

    private processSitemapListedLinks(
        domainID: number,
        unvisitedLinks: string[],
        tx: ScanDatabaseTransaction,
    ) {
        const listedURLs = sanitizeLinksIntoURLs(unvisitedLinks).validURLs;
        log.debug(
            `(Domain ${domainID}) Adding ${listedURLs.length} listed sitemap URLs to linkpaths...`,
        );

        for (const url of listedURLs) {
            const linkID = this.scanDB.createLinkPathname(
                {
                    domainID,
                    pathname: url.pathname,
                },
                tx,
            );

            this.linkIDs.push(linkID);
        }
    }
}

function getNumLinks(pageResult: SiteScrapeResult): number {
    if (!pageResult.scrapedData) {
        return 0;
    }

    return pageResult.scrapedData.values
        .map((v) =>
            v.category &&
            v.category === WebDataCategory.Links &&
            Array.isArray(v.data)
                ? v.data.length
                : 0,
        )
        .reduce((acc, l) => acc + l, 0);
}

function getFirstCategoryValue(
    pageResult: SiteScrapeResult,
    category: WebDataCategory,
): string | undefined {
    if (!pageResult.scrapedData) {
        return undefined;
    }

    return pageResult.scrapedData.values.find((v) => v.category === category)
        ?.data;
}

function stringifyValueGroup(
    pageResult: SiteScrapeResult,
    category: WebDataCategory,
): string | undefined {
    if (!pageResult.scrapedData) {
        return undefined;
    }

    const joinedValues: string[] = pageResult.scrapedData.values
        .filter((v) => v.category === category)
        .map((scrapedValue) => scrapedValue.data);

    if (joinedValues.length === 0) {
        // log.warn()
        return undefined;
    }

    return JSON.stringify(joinedValues);
}
