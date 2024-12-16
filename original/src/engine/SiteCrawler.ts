import { MAIN_LOGGER } from "./utils/mainLogger";
import { sanitizeLinksIntoURLs } from "./utils/sanitizeLinks";
import { mergeSettings } from "./scraping/utils/mergeSettings";
import SiteConfig from "./sites/SiteConfig";
import BaseWebpage from "./adapters/webpage";
import { PageRoutine } from "./routines/routine";
import {
    crawlURLs,
    CrawlParams,
    CrawlResult,
    DEFAULT_CRAWL_PARAMS,
    DEFAULT_CRAWL_ROUTINE,
    CrawlingError,
} from "./crawl";
import { WebDataCategory } from "./scraping/categories";
import SiteScraper, { SiteScrapeResult } from "./SiteScraper";
import { waitForDelay } from "./scraping/utils/waitForDelay";

export const log = MAIN_LOGGER.getSubLogger({ name: "SiteCrawler" });

export type SiteCrawlResult = {
    siteHostname: string;
    siteMetadata?: { robotsText?: string };
    errors: SerializedSiteCrawlError[];
} & Omit<CrawlResult<SiteScrapeResult>, "errors">;

export type SerializedSiteCrawlError = {
    link: string;
    pathLabel?: string;
    errorMsg: string;
    visitStartTime: number;
    visitEndTime: number;
};

export default class SiteCrawler {
    // Static Defaults
    public static readonly DEFAULT_PARAMS: Required<CrawlParams> =
        DEFAULT_CRAWL_PARAMS;

    public static readonly DEFAULT_ROUTINE: PageRoutine = DEFAULT_CRAWL_ROUTINE;

    private scraper: SiteScraper;

    constructor(siteConfig: SiteConfig, ignorePathnames: string[]) {
        this.scraper = new SiteScraper(
            siteConfig,
            ignorePathnames,
            SiteCrawler.DEFAULT_ROUTINE,
        );
    }

    /**
     *  Execute page routines, process results for links,
     *  put links back into queue
     *
     * TODO: Fast queue implementation
     */
    public async crawlSiteURLs(
        seedURLs: URL[],
        crawlParams: Partial<CrawlParams>,
        webpage?: BaseWebpage,
    ): Promise<SiteCrawlResult> {
        const params = mergeSettings(SiteCrawler.DEFAULT_PARAMS, crawlParams);

        const pageResultProducer = async (
            url: URL,
        ): Promise<SiteScrapeResult | undefined> => {
            return await this.scraper.scrapeURL(url, webpage);
        };

        const linkProducer = (pageResult: SiteScrapeResult): string[] => {
            if (!pageResult.scrapedData) {
                return [];
            }

            return pageResult.scrapedData.values
                .filter((v) => v.category === WebDataCategory.Links)
                .map((v) => v.data);
        };

        // EXECUTE

        // this.getRobotsParser(); // Just to make sure there's a loaded robots.txt

        const crawlResult = await crawlURLs<SiteScrapeResult>(
            seedURLs,
            params,
            pageResultProducer,
            linkProducer,
        );

        return {
            siteHostname: this.siteHostname,
            ...crawlResult,
            errors: this.serializePathErrors(crawlResult.errors),
        };
    }

    /**
     *
     *
     */

    public async crawlSitemapIndexes(
        crawlParams: Partial<CrawlParams>,
    ): Promise<SiteCrawlResult> {
        const params = mergeSettings(SiteCrawler.DEFAULT_PARAMS, {
            ...crawlParams,
        });

        const sitemapURLs = await this.scraper.getSitemapURLs();

        // Crawler functions

        const resultProducer = async (
            url: URL,
        ): Promise<SiteScrapeResult | undefined> => {
            log.info(`Starting fetch for URL: ${url.href}`);
            const sitemap = await this.scraper.scrapeSitemap(url);
            if (!sitemap) {
                return undefined;
            }

            log.info(`Fetched sitemap URL ${url.href}`);

            if (sitemap.sitemapListedLinks) {
                const validURLs = sanitizeLinksIntoURLs(
                    sitemap.sitemapListedLinks,
                ).validURLs.filter((url) => !this.scraper.urlIsOk(url));

                log.info(
                    `Sitemap Crawl scraped ${validURLs.length} listed links`,
                );
            }

            return sitemap;
        };

        // Only follow index links to more sitemaps
        const linkProducer = (sitemap: SiteScrapeResult): string[] => {
            if (sitemap.sitemapIndexedLinks) {
                log.info(
                    `Sitemap Crawl queued ${sitemap.sitemapIndexedLinks.length} sitemap list links from index ${sitemap.pageLink}`,
                );
                return sitemap.sitemapIndexedLinks;
            }
            return [];
        };

        log.info(`BEGIN SITEMAP INDEX CRAWL: ${this.siteHostname}`);

        const crawlResult = await crawlURLs<SiteScrapeResult>(
            sitemapURLs,
            params,
            resultProducer,
            linkProducer,
        );

        const listedLinks: string[] = [];
        for (const pageResult of crawlResult.pageResults) {
            if (pageResult.sitemapListedLinks) {
                listedLinks.push(...pageResult.sitemapListedLinks);
            }
        }
        log.info(
            `END SITEMAP INDEX CRAWL FOR ${this.siteHostname}: GATHERED ${listedLinks.length} LISTED LINKS`,
        );

        return {
            siteHostname: this.siteHostname,
            ...crawlResult,
            errors: this.serializePathErrors(crawlResult.errors),
        };
    }

    public async crawlSitemapURLs(
        crawlParams: Partial<CrawlParams>,
        webpage: BaseWebpage,
        delayBetweenCrawlsMS: number = 5 * 60 * 1000, // 5 minutes between crawls
    ): Promise<{
        indexResult: SiteCrawlResult;
        mainResult?: SiteCrawlResult;
    }> {
        const params = mergeSettings(SiteCrawler.DEFAULT_PARAMS, crawlParams);

        const indexResult = await this.crawlSitemapIndexes(crawlParams);

        // Don't crawl if sitemaps had errors (likely got blocked)
        if (indexResult.errors.length > 0) {
            return { indexResult };
        }

        const listedLinks: string[] = [];
        for (const pageResult of indexResult.pageResults) {
            if (pageResult.sitemapListedLinks) {
                listedLinks.push(...pageResult.sitemapListedLinks);
            }
        }

        const listedURLs = sanitizeLinksIntoURLs(listedLinks).validURLs;

        // Wait between crawls
        waitForDelay(indexResult.endTime, delayBetweenCrawlsMS);

        const mainResult = await this.crawlSiteURLs(
            listedURLs,
            params,
            webpage,
        );

        return { indexResult, mainResult };
    }

    public async initilizationCrawl() {
        //TODO: authenticate, get robots, get new sitemap links, check config validations, etc.
    }

    // UTILS

    private serializePathErrors(
        errors: CrawlingError[],
    ): SerializedSiteCrawlError[] {
        return errors.map((error) => {
            return {
                link: error.crawledURL.href,
                // pathLabel: this.matchSitePath(error.crawledURL)?.label,
                errorMsg: error.message,
                visitStartTime: error.visitStartTime,
                visitEndTime: error.catchTime,
            };
        });
    }

    // HOSTNAME UTILS

    public get siteHostname(): string {
        return this.scraper.siteHostname;
    }
}
