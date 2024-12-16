import BaseWebpage from "../adapters/webpage";
import { SCRAPING_LOGGER } from "./utils/scrapingLogger";
import { waitForDelay } from "./utils/waitForDelay";
import { mergeSettings } from "./utils/mergeSettings";
import ScrapingCoreError from "./utils/ScrapingCoreError";
import { pickRandomUserAgent, randomizeVisitInterval } from "./utils/randomize";
import { WebAuth } from "../requests/auth";
import { USER_AGENTS_1, USER_AGENTS_2 } from "../requests/configs";
import {
    ScrapeParams,
    ScrapeResult,
    ScrapedData,
    scrapeWithFetcher,
    scrapeWithWebpage,
} from "./scrape";
import { PageRoutine } from "../routines/routine";

import Fetcher from "../requests/Fetcher";

const log = SCRAPING_LOGGER.getSubLogger({ name: "Scraper" });

export type ScraperSettings = {
    useStealth: boolean;
    timeout: number;
    minInterval: number;
    intervalNoiseMax: number;
    actionNoiseMax: number;
};

export default class Scraper {
    public static readonly DEFAULT_SETTINGS: Required<ScraperSettings> = {
        useStealth: true,
        minInterval: 5000,
        intervalNoiseMax: 3000,
        actionNoiseMax: 100,
        timeout: 10000,
    } as const;
    private static readonly DEFAULT_USER_AGENT = USER_AGENTS_2[0];
    private static readonly ROTATING_USER_AGENTS = USER_AGENTS_2;

    public readonly settings: ScraperSettings;
    private fetcher: Fetcher;

    private scrapeCount = 0;
    private lastVisitTime?: number;
    private _isWaiting = false;

    constructor(settings: Partial<ScraperSettings>) {
        // Ensure that any undefined or non-number setting values are replaced by defaults
        this.settings = mergeSettings(Scraper.DEFAULT_SETTINGS, settings);
        this.fetcher = new Fetcher({
            useStealthHeaders: this.settings.useStealth,
            timeout: this.settings.timeout,
        });
    }

    /**
     * Navigates webpage to specified URL and attempts to extract data using configured routines
     * that specify browser actions to execute and data targets to extract.
     *
     * If provided multiple user agents, randomly selects one to use.
     */
    public async scrapeURL(
        url: URL,
        routine: PageRoutine,
        webpage?: BaseWebpage,
        auth?: WebAuth,
    ): Promise<ScrapeResult> {
        const interval = await this.respectVisitInterval();

        // DO NOT SHUFFLE UA IF USING AUTH
        const userAgent =
            this.settings.useStealth && !auth
                ? this.getRandomUserAgent()
                : Scraper.DEFAULT_USER_AGENT;

        const scrapeParams: ScrapeParams = {
            routine,
            userAgent,
            timeout: this.settings.timeout,
            useStealth: this.settings.useStealth,
        };

        const result: ScrapeResult =
            !webpage || Scraper.canFetch(routine, auth)
                ? await scrapeWithFetcher(url, this.fetcher, scrapeParams)
                : await scrapeWithWebpage(url, webpage, scrapeParams);

        this.scrapeCount++;
        return result;
    }

    public async scrapeRobotsText(homeURL: URL): Promise<ScrapeResult> {
        const interval = await this.respectVisitInterval();

        const userAgent = this.settings.useStealth
            ? this.getRandomUserAgent()
            : Scraper.DEFAULT_USER_AGENT;

        const startTime = Date.now();
        try {
            const fetchResult = await this.fetcher.fetchRobots(
                homeURL,
                userAgent,
            );

            log.info(`Fetched robots.txt for ${homeURL.href}`);
            return {
                reqMethod: "fetch",
                status: fetchResult.status,
                pageLink: fetchResult.link,
                pageTitle: "robots.txt",
                startTime,
                endTime: Date.now(),

                robotsText: fetchResult.content,
            };
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.RobotsFetch,
                {
                    url: homeURL,
                    settings: this.settings,
                    startTime,
                    interval,
                    userAgent,
                },
                error as Error,
            );
        }
    }

    public async scrapeSitemap(
        sitemapURL: URL,
        linkLimit?: number,
    ): Promise<ScrapeResult> {
        const interval = await this.respectVisitInterval();

        const userAgent = this.settings.useStealth
            ? this.getRandomUserAgent()
            : Scraper.DEFAULT_USER_AGENT;

        const startTime = Date.now();
        try {
            const sitemap = await this.fetcher.fetchSitemap(
                sitemapURL,
                userAgent,
            );

            log.info(`Fetched sitemap ${sitemapURL.href}`);

            if (sitemap.pageLinks) {
                log.info(
                    `Scraped ${sitemap.pageLinks.length} URLs from sitemap ${sitemapURL.href} (Limit: ${linkLimit})`,
                );
                return {
                    reqMethod: "fetch",
                    status: sitemap.status,
                    pageLink: sitemap.link,
                    startTime,
                    endTime: Date.now(),
                    sitemapListedLinks: sitemap.pageLinks.map(
                        ({ link }) => link,
                    ),
                };
            }

            if (sitemap.nestedSitemapLinks) {
                log.info(
                    `Scraped sitemap index ${sitemapURL.href}: scraping sitemaps (Limit: ${linkLimit})`,
                );
                return {
                    reqMethod: "fetch",
                    status: sitemap.status,
                    pageLink: sitemap.link,
                    startTime,
                    endTime: Date.now(),
                    sitemapIndexedLinks: sitemap.nestedSitemapLinks.map(
                        ({ link }) => link,
                    ),
                };
            }

            throw new ScraperError(ScraperErrorType.SitemapInvalid, {
                url: sitemapURL,
                settings: this.settings,
                respStatus: sitemap.status,
                respText: sitemap.content,
                startTime,
                interval,
                userAgent,
            });
        } catch (error) {
            if (error instanceof ScraperError) {
                throw error;
            }

            throw new ScraperError(
                ScraperErrorType.SitemapFetch,
                {
                    url: sitemapURL,
                    settings: this.settings,
                    startTime,
                    interval,
                    userAgent,
                },
                error as Error,
            );
        }
    }

    // UTIL METHODS

    /**
     *
     */
    private async respectVisitInterval(): Promise<number> {
        // Wait for interval since last visit time
        this._isWaiting = true;
        await waitForDelay(this.lastVisitTime ?? 0, this.getRandomInterval());

        const now = Date.now();
        const interval = this.lastVisitTime ? now - this.lastVisitTime : 0;
        this.lastVisitTime = now;
        this._isWaiting = false;

        return interval;
    }

    private getRandomInterval(): number {
        const {
            minInterval: minIntervalMS,
            intervalNoiseMax: intervalNoiseMaxMS,
        } = this.settings;
        return randomizeVisitInterval(minIntervalMS, intervalNoiseMaxMS);
    }

    private getRandomUserAgent(): string {
        const userAgent = pickRandomUserAgent(Scraper.ROTATING_USER_AGENTS);
        log.debug(`Selected random user agent`);
        return userAgent;
    }

    private static canFetch(routine: PageRoutine, auth?: WebAuth): boolean {
        const routineIsFetchable =
            routine.length === 1 && !routine[0].actionInsns;

        const authIsFetchable = !auth || auth.method.type === "http";

        return routineIsFetchable && authIsFetchable;
    }
}

// ERRORS

export enum ScraperErrorType {
    Unknown = "Unknown",
    RoutineFailed = "Routine Failed",
    NavTimeout = "Navigation Timeout",
    NavBadResponse = "Navigation Bad Response",
    RobotsFetch = "Robots.txt Fetch Error",
    SitemapFetch = "Sitemap Fetch Error",
    SitemapInvalid = "Invalid Sitemap",
}

type ScraperErrorContext = {
    url: URL;
    settings: ScraperSettings;
    startTime: number;
    interval: number;
    userAgent: string | undefined;
    auth?: WebAuth;
    routine?: PageRoutine;
    respStatus?: number;
    partialScrapedData?: ScrapedData;
    respText?: string;
};

export class ScraperError extends ScrapingCoreError<
    ScraperErrorType,
    ScraperErrorContext
> {
    constructor(
        public errorType: ScraperErrorType,
        public context: ScraperErrorContext,
        public caughtError?: Error,
    ) {
        super(errorType, context, caughtError);
        this.name = this.constructor.name;
        log.error(this.message); // assuming `log.error` is equivalent to `console.error` in this example
    }
}
