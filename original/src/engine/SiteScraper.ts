import { MAIN_LOGGER } from "./utils/mainLogger";
import { sanitizeLinksIntoURLs } from "./utils/sanitizeLinks";
import { mergeSettings } from "./scraping/utils/mergeSettings";
import BaseWebpage from "./adapters/webpage";
import { PageRoutine } from "./routines/routine";
import Scraper from "./scraping/Scraper";
import { ScrapeResult } from "./scraping/scrape";
import { WebDataCategory } from "./scraping/categories";
import { RobotsParser, buildRobotsParser } from "./requests/robots";
import SiteConfig from "./sites/SiteConfig";
import {
    CompiledSitePaths,
    ReservedPathLabel,
    SitePath,
    compileSitePaths,
    matchPathnameToRoutine,
} from "./sites/paths";
import { SiteAuth } from "./sites/auth";
import { SiteRules } from "./sites/rules";

export const log = MAIN_LOGGER.getSubLogger({ name: "SiteScraper" });

export type SiteScrapeResult = ScrapeResult & {
    pathLabel?: string;
};

export default class SiteScraper {
    private scraper: Scraper;
    readonly homepageURL: URL;
    readonly siteAuth: SiteAuth;
    readonly siteRules: SiteRules;
    readonly sitePaths: CompiledSitePaths;

    private ignorePathnames: Set<string>; // May be updated during crawling
    private defaultRoutine?: PageRoutine;

    private _robotsScrape?: SiteScrapeResult;
    private _robotsParser?: RobotsParser;
    private _robotsText?: string;

    constructor(
        siteConfig: SiteConfig,
        ignorePathnames: string[],
        defaultRoutine?: PageRoutine,
    ) {
        // Unpack config
        this.homepageURL = new URL(siteConfig.homeLink);
        this.siteAuth = siteConfig.auth;
        this.siteRules = siteConfig.rules;
        this.sitePaths = compileSitePaths(siteConfig.paths);

        this.scraper = new Scraper({
            ...this.siteRules,
        });

        this.ignorePathnames = new Set<string>(ignorePathnames);
        this.defaultRoutine = defaultRoutine;

        const robotsText = this.siteRules.robotsText;
        if (robotsText && robotsText !== "") {
            this._robotsParser = buildRobotsParser(
                siteConfig.homeLink,
                robotsText,
            );
        }
    }

    /**
     *  Execute page routines, process results for links,
     *  put links back into queue
     *
     * TODO: Fast queue implementation
     */
    public async scrapeURL(
        url: URL,
        webpage?: BaseWebpage,
    ): Promise<SiteScrapeResult | undefined> {
        if (!this.urlIsOk(url)) {
            return undefined;
        }

        const matchedPath = this.matchSitePath(url);

        const routine = matchedPath?.routine ?? this.defaultRoutine;
        if (!routine) {
            return undefined;
        }

        log.debug(
            matchedPath
                ? `Matched routine ${matchedPath.label} for ${url.href}`
                : `No routine matched for '${url.href}: using default'`,
        );

        // VISIT URL AND SCRAPE
        const result = await this.scraper.scrapeURL(
            url,
            routine,
            webpage,
            this.siteAuth,
        );

        log.info(`Scraped site link ${result.pageLink}`);

        return {
            ...result,
            pathLabel: matchedPath?.label,
        };
    }

    public async scrapeRobots(): Promise<SiteScrapeResult> {
        if (this._robotsScrape) {
            return this._robotsScrape;
        }

        const result = await this.scraper.scrapeRobotsText(this.homepageURL);

        this._robotsScrape = result;
        return { ...result, pathLabel: ReservedPathLabel.ROBOTS };
    }

    public async scrapeSitemap(
        sitemapURL: URL,
    ): Promise<SiteScrapeResult | undefined> {
        // if (!this.urlIsOk(sitemapURL)) {
        //     return undefined;
        // }

        const result = await this.scraper.scrapeSitemap(sitemapURL);

        const pathLabel = result.sitemapIndexedLinks
            ? ReservedPathLabel.SITEMAPINDEX
            : result.sitemapListedLinks
              ? ReservedPathLabel.SITEMAPLIST
              : ReservedPathLabel.SITEMAPMISC;

        return { ...result, pathLabel };
    }

    // UTILS

    matchSitePath(url: URL): Omit<SitePath, "pattern"> | undefined {
        if (url.hostname !== this.siteHostname) {
            return undefined;
        }

        return matchPathnameToRoutine(url, this.sitePaths);
    }

    urlIsOk(url: URL): boolean {
        if (url.hostname !== this.siteHostname) {
            log.info(`Rejected ${url.href}: off-site hostname`);
            return false;
        }

        if (this.allowedByREP(url) === false) {
            log.info(
                `Rejected ${url.href}: explicitly not allowed by robots.txt`,
            );
            return false;
        }

        if (this.ignorePathnames.has(url.pathname)) {
            log.info(`Rejected ${url.href}: pathname ignored`);
            return false;
        }

        return true;
    }

    get siteHostname(): string {
        return this.homepageURL.hostname;
    }

    // ROBOTS & SITEMAP UTILS

    async getRobotsParser(): Promise<RobotsParser> {
        if (!this._robotsParser || this._robotsText === "") {
            log.warn(
                `No pre-loaded robots.txt for ${this.homepageURL}: Scraping robots.txt.`,
            );

            const { robotsText } = await this.scrapeRobots();

            this._robotsParser = buildRobotsParser(
                this.homepageURL.href,
                robotsText!, // Non-null assertion
            );
        }

        return this._robotsParser;
    }

    async getCrawlDelayMS(): Promise<number> {
        const robotsDelaySeconds = (
            await this.getRobotsParser()
        ).getCrawlDelay();

        const rulesDelayMS = this.siteRules.minInterval;

        // If both are available, pick the most conservative
        if (robotsDelaySeconds && rulesDelayMS) {
            return Math.max(robotsDelaySeconds, robotsDelaySeconds) * 1000;
        } else if (robotsDelaySeconds) {
            return robotsDelaySeconds * 1000;
        } else if (rulesDelayMS) {
            return rulesDelayMS;
        } else {
            return Scraper.DEFAULT_SETTINGS.minInterval;
        }
    }

    async getSitemapURLs(): Promise<URL[]> {
        const robotsParser = await this.getRobotsParser();
        const sitemapURLs = sanitizeLinksIntoURLs(
            robotsParser.getSitemaps(),
        ).validURLs.filter((url) => !this.ignorePathnames.has(url.pathname));

        return sitemapURLs;
    }

    allowedByREP(url: URL): boolean | undefined {
        if (!this._robotsParser) return undefined;
        return this._robotsParser.isAllowed(url.href);
    }
}
