import { SCAN_LOGGER } from "./utils/scanLogger";
import { groupLinksByHostname } from "./utils/sanitizeLinks";
import WebCrawlEngine, {
    SiteCrawl,
    WebCrawlResult,
} from "@/engine/WebCrawlEngine";
import SiteConfigDatabase from "../../db/SiteConfigDatabase";
import ScanDatabaseSync from "@/db/ScanDatabaseSync";
import { domains, linkpaths, pageerrors, pagescrapes } from "../../db/schema";
import { DomainRegion, DomainModel } from "../../db/models";
import { and, count, eq, isNull, notInArray, or } from "drizzle-orm";
import { SiteCrawlResult } from "../../engine/SiteCrawler";
import ScanDataProcessor, { WebScanDataIDs } from "./processor";
import { CrawlParams } from "@/engine/crawl";
import { ReservedPathLabel } from "../../engine/sites/paths";
import { BrowserType, PUPPETEER_BROWSERS } from "./puppeteer";

const log = SCAN_LOGGER.getSubLogger({ name: "ScanEngine" });

export type ScanTask = "links" | "backlogs" | "indexes" | "frontpages";

export type ScanParams = { useStealth: boolean };

export type ScanPayload =
    | {
          scanID: number;
          success: true;
          startTime: number;
          endTime: number;
          stats: WebScanDataIDs;
      }
    | {
          scanID: number;
          success: false;
          startTime: number;
          endTime: number;
          errorJSON: string;
      };
{
}

const DEFAULT_BROWSER_TYPE: BrowserType = "Native";

export const DEFAULT_GLOBAL_MIN_CRAWL_DELAY = 1000;
export const DEFAULT_BATCH_SIZE = 10;

export default class ScanEngine {
    private scanDB: ScanDatabaseSync;
    private configDB: SiteConfigDatabase;
    private dataProcessor: ScanDataProcessor;

    constructor(webDB: ScanDatabaseSync, configDB: SiteConfigDatabase) {
        this.scanDB = webDB;
        this.configDB = configDB;
        this.dataProcessor = new ScanDataProcessor(this.scanDB);
    }

    // "Seeds"
    public async scanLinks(
        domainIDs: number[],
        seedLinks: string[],
        crawlParams: Partial<CrawlParams>,
    ): Promise<ScanPayload> {
        const groupedURLs = groupLinksByHostname(seedLinks);

        const crawlConfigurer = async (
            domainID: number,
        ): Promise<SiteCrawl> => {
            const siteConfig = this.configDB.getConfig(domainID);

            const siteSeedURLs =
                groupedURLs.find(
                    ({ hostname }) => hostname === siteConfig.hostname,
                )?.urls ?? [];

            const visitedLinksPathnames = (
                await this.scanDB.orm
                    .select()
                    .from(pagescrapes)
                    .leftJoin(
                        linkpaths,
                        eq(pagescrapes.linkID, linkpaths.linkID),
                    )
                    .where(eq(linkpaths.domainID, domainID))
            )
                .map(({ linkpaths }) => linkpaths ?? [])
                .flat()
                .map(({ pathname }) => pathname);

            return {
                crawlID: domainID,
                siteConfig,
                seedURLs: siteSeedURLs,
                ignorePathnames: visitedLinksPathnames,
            };
        };

        const crawlExecutor = async (
            engine: WebCrawlEngine,
            crawlParams: Partial<CrawlParams>,
        ) => {
            return await engine.crawlSites(crawlParams);
        };

        return await this.runScan(
            "links",
            domainIDs,
            { ...crawlParams, followLinks: true },
            crawlConfigurer,
            crawlExecutor,
        );
    }

    public async scanBacklogs(
        domainIDs: number[],
        crawlParams: Partial<CrawlParams>,
    ): Promise<ScanPayload> {
        const crawlConfigurer = async (
            domainID: number,
        ): Promise<SiteCrawl> => {
            const siteConfig = this.configDB.getConfig(domainID);

            const unvisitedURLs = (
                await this.scanDB.orm
                    .select()
                    .from(linkpaths)
                    .where(
                        and(
                            eq(linkpaths.domainID, domainID),
                            isNull(linkpaths.pathlabel), // No label => not scraped, or sitemap etc.
                        ),
                    )
            ).map(({ pathname }) => new URL(pathname, siteConfig.homeLink));

            const visitedLinks = (
                await this.scanDB.orm
                    .select()
                    .from(pagescrapes)
                    .leftJoin(
                        linkpaths,
                        eq(pagescrapes.linkID, linkpaths.linkID),
                    )
                    .where(eq(linkpaths.domainID, domainID))
            )
                .map(({ linkpaths }) => linkpaths ?? [])
                .flat()
                .map(({ pathname }) => pathname);

            return {
                crawlID: domainID,
                siteConfig,
                seedURLs: unvisitedURLs,
                ignorePathnames: visitedLinks,
            };
        };

        const crawlExecutor = async (
            engine: WebCrawlEngine,
            crawlParams: Partial<CrawlParams>,
        ) => {
            return await engine.crawlSites(crawlParams);
        };

        return await this.runScan(
            "backlogs",
            domainIDs,
            crawlParams,
            crawlConfigurer,
            crawlExecutor,
        );
    }

    public async scanIndexes(
        domainIDs: number[],
        crawlParams: Partial<CrawlParams>,
    ): Promise<ScanPayload> {
        const crawlConfigurer = async (
            domainID: number,
        ): Promise<SiteCrawl> => {
            const siteConfig = this.configDB.getConfig(domainID);

            const failedSitemapLinks = await this.scanDB.orm
                .select({ pathname: linkpaths.pathname })
                .from(pageerrors)
                .innerJoin(linkpaths, eq(pageerrors.linkID, linkpaths.linkID))
                .where(
                    or(
                        eq(linkpaths.pathlabel, ReservedPathLabel.SITEMAPINDEX),
                        eq(linkpaths.pathlabel, ReservedPathLabel.SITEMAPLIST),
                    ),
                );

            return {
                crawlID: domainID,
                siteConfig,
                ignorePathnames: failedSitemapLinks.map(
                    (entry) => entry.pathname,
                ),
            };
        };

        const crawlExecutor = async (
            engine: WebCrawlEngine,
            crawlParams: Partial<CrawlParams>,
        ) => {
            return await engine.crawlSitemaps(crawlParams);
        };

        return await this.runScan(
            "indexes",
            domainIDs,
            crawlParams,
            crawlConfigurer,
            crawlExecutor,
        );
    }

    public async scanFrontpages(
        domainIDs: number[],
        crawlParams: Partial<CrawlParams>,
    ): Promise<ScanPayload> {
        const crawlConfigurer = async (
            domainID: number,
        ): Promise<SiteCrawl> => {
            const siteConfig = this.configDB.getConfig(domainID);

            const homepageURL = (
                await this.scanDB.orm
                    .select()
                    .from(domains)
                    .where(eq(domains.domainID, domainID))
            ).map(({ homeLink }) => [new URL(homeLink)])[0];

            const visitedLinks = (
                await this.scanDB.orm
                    .select()
                    .from(pagescrapes)
                    .leftJoin(
                        linkpaths,
                        eq(pagescrapes.linkID, linkpaths.linkID),
                    )
                    .where(eq(linkpaths.domainID, domainID))
            )
                .map(({ linkpaths }) => linkpaths ?? [])
                .flat()
                .map(({ pathname }) => pathname);

            return {
                crawlID: domainID,
                siteConfig,
                seedURLs: homepageURL,
                ignorePathnames: visitedLinks,
            };
        };

        const crawlExecutor = async (
            engine: WebCrawlEngine,
            crawlParams: Partial<CrawlParams>,
        ) => {
            return await engine.crawlSites({
                ...crawlParams,
                followLinks: true,
                requireRoutines: false,
            });
        };

        return await this.runScan(
            "frontpages",
            domainIDs,
            { ...crawlParams, followLinks: true, requireRoutines: false },
            crawlConfigurer,
            crawlExecutor,
        );
    }

    // ALGORITHM

    private async runScan(
        scanTask: ScanTask,
        domainIDs: number[],
        crawlParams: Partial<CrawlParams>,
        crawlConfigurer: (
            domainID: number,
        ) => Promise<Omit<SiteCrawl, "resultCallback">>,
        crawlExecutor: (
            engine: WebCrawlEngine,
            crawlParams: Partial<CrawlParams>,
        ) => Promise<WebCrawlResult>,
    ): Promise<ScanPayload> {
        const { scanID, startTime } = await this.scanDB.createWebScan({
            startTime: Date.now(),
            scanType: scanTask.toString(),
        });

        try {
            const browser = new PUPPETEER_BROWSERS[DEFAULT_BROWSER_TYPE]();
            const engine = new WebCrawlEngine(browser, {
                batchSize: DEFAULT_BATCH_SIZE,
            });

            for (const domainID of domainIDs) {
                const crawl = await crawlConfigurer(domainID);
                engine.queueSiteCrawl(crawl);
            }

            // EXECUTE CRAWL AND PROCESS RESULTS

            const crawlResult = await crawlExecutor(engine, crawlParams);

            this.dataProcessor.init();
            for (const siteResult of crawlResult.siteResults) {
                log.info(
                    `Storing data for site crawl (id ${siteResult.crawlID})...`,
                );
                this.dataProcessor.processSiteCrawlResult(
                    scanID,
                    siteResult.crawlID,
                    siteResult,
                );
                log.info(
                    `Stored data for site crawl (id ${siteResult.crawlID})`,
                );
            }

            const stats = this.dataProcessor.getDataIDs();

            const endTime = Date.now();

            this.scanDB.updateWebScan(scanID, { endTime });
            log.info(
                `Scan successful (${scanTask}). Scanned ${crawlResult.siteResults.length} sites and stored: ${stats.crawlIDs.length} crawls, ${stats.scrapeIDs.length} page scrapes, ${stats.errorIDs.length} errors, ${stats.linkIDs.length} links`,
            );

            return {
                scanID,
                success: true,
                startTime,
                endTime,
                stats,
            };
        } catch (error) {
            const endTime = Date.now();
            this.scanDB.updateWebScan(scanID, { endTime });

            const errorJSON = JSON.stringify(
                error,
                Object.getOwnPropertyNames(error),
            );

            log.fatal(
                `Site crawls task failed. Browser closed. Error: ${errorJSON}`,
            );
            return {
                scanID,
                success: false,
                errorJSON,
                startTime,
                endTime,
            };
        }
    }
}
