import { MAIN_LOGGER } from "./utils/mainLogger";
import BaseBrowser from "./adapters/browser";
import BaseWebpage from "./adapters/webpage";
import SiteConfig from "./sites/SiteConfig";
import SiteCrawler, { SiteCrawlResult } from "./SiteCrawler";
import { CrawlParams } from "./crawl";
import Scraper from "./scraping/Scraper";

const log = MAIN_LOGGER;

export type WebEngineSettings = {
    batchSize: number;
};

export type WebCrawlResult = {
    siteResults: (SiteCrawlResult & { crawlID: number })[];
    startTime: number;
    endTime: number;
    batchErrors: BatchError[];
};

export type SiteCrawl = {
    crawlID: number;
    siteConfig: SiteConfig;
    seedURLs?: URL[];
    ignorePathnames?: string[];
};

type BatchError = {
    siteCrawlIDs: number[];
    message: string;
    startTime: number;
    endTime: number;
};

type ResultProducer = (
    crawlID: number,
    seedURLs: URL[],
    crawlParams: Partial<CrawlParams>,
    siteCrawler: SiteCrawler,
) => Promise<SiteCrawlResult & { crawlID: number }>;

/**
 * Crawls sites by loading a tailored Site Crawler according to a SiteConfig.
 *
 * Each crawler acts as a thread that sequentially scrapes pages,
 * with each thread run in parallel.
 *
 * If there are too many threads created, then the jobs will be split into batches
 * and run sequentially.
 */
export default class WebCrawlEngine {
    private crawlQueue: SiteCrawl[] = [];
    constructor(
        readonly browser: BaseBrowser,
        readonly settings: WebEngineSettings,
    ) {}

    // MAIN METHODS

    /**
     * Groups URLs into arrays by hostname for sequential crawling,
     * then runs sequential crawls in parallel for each site
     */

    public async crawlSites(
        crawlParams: Partial<CrawlParams>,
    ): Promise<WebCrawlResult> {
        log.info(`Initializing browser for site crawls`);

        const resultProducer = async (
            crawlID: number,
            seedURLs: URL[],
            crawlParams: Partial<CrawlParams>,
            siteCrawler: SiteCrawler,
        ): Promise<SiteCrawlResult & { crawlID: number }> => {
            const webpage = await this.browser.newWebpage();
            const siteCrawlResult = await siteCrawler.crawlSiteURLs(
                seedURLs,
                crawlParams,
                webpage,
            );

            await webpage.close();
            return { ...siteCrawlResult, crawlID };
        };

        await this.browser.init();
        const result = await this.runWebCrawl(crawlParams, resultProducer);
        await this.browser.close();

        return result;
    }

    public async crawlSitemaps(
        crawlParams: Partial<CrawlParams>,
    ): Promise<WebCrawlResult> {
        const resultProducer = async (
            crawlID: number,
            seedURLs: URL[],
            crawlParams: Partial<CrawlParams>,
            siteCrawler: SiteCrawler,
        ): Promise<SiteCrawlResult & { crawlID: number }> => {
            const result = await siteCrawler.crawlSitemapIndexes(crawlParams);
            return { ...result, crawlID };
        };

        return await this.runWebCrawl(crawlParams, resultProducer);
    }

    public queueSiteCrawl(siteCrawl: SiteCrawl) {
        const existingCrawlIndex = this.crawlQueue.findIndex(
            (sc) => sc.siteConfig.hostname === siteCrawl.siteConfig.hostname,
        );

        if (existingCrawlIndex === -1) {
            this.crawlQueue.push(siteCrawl);
            log.info(
                `Queued site crawl for ${siteCrawl.siteConfig.hostname} (${this.crawlQueue.length} queued)`,
            );
        } else {
            this.crawlQueue[existingCrawlIndex] = siteCrawl;
            log.warn(
                `Updated queued crawl for ${siteCrawl.siteConfig.hostname} (${this.crawlQueue.length} queued)`,
            );
        }
    }

    /**
     * Groups URLs into arrays by hostname for sequential crawling,
     * then runs sequential crawls in parallel for each site
     *
     * If no seed links provided for a site, the crawl will begin from the site's homepage
     */

    private async runWebCrawl(
        crawlParams: Partial<CrawlParams>,
        resultProducer: ResultProducer,
    ): Promise<WebCrawlResult> {
        log.info(`START PARALLEL WEB CRAWL (${this.crawlQueue.length} sites)`);
        const startTime = Date.now();
        const batchResults: (SiteCrawlResult & { crawlID: number })[][] = [];
        const batchErrors: BatchError[] = [];

        while (this.crawlQueue.length > 0) {
            const batch: SiteCrawl[] = [];
            const batchStartTime = Date.now();
            for (let count = 0; count < this.settings.batchSize; count++) {
                const crawl = this.crawlQueue.shift();
                if (!crawl) break;
                batch.push(crawl);
            }

            try {
                const batchResult = await this.crawlParallel(
                    batch,
                    crawlParams,
                    resultProducer,
                );
                batchResults.push(batchResult);
            } catch (error) {
                const endTime = Date.now();
                const batchError: BatchError = {
                    siteCrawlIDs: batch.map((b) => b.crawlID),
                    message: (error as Error).message,
                    startTime,
                    endTime,
                };

                log.error(
                    `Caught error during parallel batch crawl | Site hostnames: ${batchError.siteCrawlIDs} | Ran for ${endTime - batchStartTime}ms | Error: ${batchError.message} ${(error as Error).stack} `,
                );
                batchErrors.push(batchError);
            }
        }

        const endTime = Date.now();
        const results = batchResults.flat();

        log.info(
            `END PARALLEL WEB CRAWL (${results.length} sites in ${(endTime - startTime) / 1000} seconds)`,
        );
        return { siteResults: results.flat(), startTime, endTime, batchErrors };
    }

    private async crawlParallel(
        crawls: SiteCrawl[],
        crawlParams: Partial<CrawlParams>,
        resultProducer: ResultProducer,
    ): Promise<(SiteCrawlResult & { crawlID: number })[]> {
        log.info(`START PARALLEL BATCH CRAWL (${crawls.length} sites)`);
        const startTime = Date.now();
        const results = await Promise.allSettled(
            crawls.map(async (crawl) => {
                try {
                    // Directly return the result of runSiteCrawl as it is an async function
                    // and already returns a Promise.
                    return await this.runSiteCrawl(
                        crawl,
                        crawlParams,
                        resultProducer,
                    );
                } catch (error) {
                    log.error(
                        `Error in site crawl ${crawl.siteConfig.hostname}: ${error}`,
                    );
                    // Return an object indicating failure along with relevant crawl data
                    return {
                        crawlID: crawl.crawlID,
                        siteHostname: crawl.siteConfig.hostname,
                        completed: false,
                        startTime: Date.now(),
                        endTime: Date.now(),
                        errors: [],
                        unvisitedLinks: [],
                        pageResults: [],
                    };
                }
            }),
        );

        const endTime = Date.now();
        log.info(
            `END PARALLEL BATCH CRAWL (${results.length} sites in ${(endTime - startTime) / 1000} seconds)`,
        );

        return results.map((result) =>
            result.status === "fulfilled" ? result.value : result.reason,
        );
    }

    private async runSiteCrawl(
        { crawlID, siteConfig, seedURLs, ignorePathnames }: SiteCrawl,
        crawlParams: Partial<CrawlParams>,
        resultProducer: ResultProducer,
    ): Promise<SiteCrawlResult & { crawlID: number }> {
        const siteCrawler = new SiteCrawler(siteConfig, ignorePathnames ?? []);

        const result = await resultProducer(
            crawlID,
            seedURLs ?? [],
            crawlParams,
            siteCrawler,
        );

        return { ...result, crawlID };
    }
}

// ERRORS

export class WebEngineBatchError extends Error {
    constructor(
        public crawls: SiteCrawl[],
        public batchStartTime: number,
        public caughtError: Error,
    ) {
        super(
            WebEngineBatchError.buildMsg(crawls, batchStartTime, caughtError),
        );

        log.error(this.message);
    }

    private static buildMsg(
        crawls: SiteCrawl[],
        batchStartTime: number,
        caughtError: Error,
    ): string {
        const siteHostnames = JSON.stringify(
            crawls.map((c) => c.siteConfig.hostname),
        );

        return `Caught error during parallel batch crawl | Batch init time: ${batchStartTime} | Error: ${caughtError.message} | Site hostnames: ${siteHostnames}`;
    }
}
