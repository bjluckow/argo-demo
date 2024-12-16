import { SCRAPING_LOGGER } from "../scraping/utils/scrapingLogger";
import { mergeSettings } from "../scraping/utils/mergeSettings";
import { FetchParams, FetchResponse, fetchURL } from "./fetch";
import { FetchAuthCreds } from "./fetch";
import { RobotsFetchResult, fetchRobotsText } from "./robots";
import { SitemapFetchResult, fetchSitemap } from "./sitemaps";

const log = SCRAPING_LOGGER.getSubLogger({ name: "Fetcher" });

export type FetcherSettings = { timeout: number };

export default class Fetcher {
    private static readonly DEFAULT_SETTINGS: Required<FetcherSettings> = {
        timeout: 10000,
    } as const;
    private static readonly DEFAULT_REFERER = "http://www.google.com/";

    constructor(
        readonly settings: FetcherSettings = Fetcher.DEFAULT_SETTINGS,
        protected currentReferer: string = Fetcher.DEFAULT_REFERER,
    ) {}

    async fetchPage(
        url: URL,
        userAgent: string,
        auth?: FetchAuthCreds,
    ): Promise<FetchResponse> {
        log.info(`Fetching ${url.href}...`);
        const resp = await fetchURL(url, this.getParams(userAgent, auth));
        return resp;
    }

    async fetchRobots(
        homeURL: URL,
        userAgent: string,
    ): Promise<RobotsFetchResult> {
        log.info(`Fetching robots.txt for ${homeURL.href}...`);
        const resp = await fetchRobotsText(homeURL, this.getParams(userAgent));

        return resp;
    }

    async fetchSitemap(
        sitemapURL: URL,
        userAgent: string,
    ): Promise<SitemapFetchResult> {
        log.info(`Fetching sitemap ${sitemapURL.href}...`);
        const result = await fetchSitemap(
            sitemapURL,
            this.getParams(userAgent),
        );
        return result;
    }

    // UTIL

    setReferer(referer: URL) {
        this.currentReferer = referer.href;
    }

    private getParams(userAgent: string, auth?: FetchAuthCreds): FetchParams {
        return { userAgent, auth, timeout: this.settings.timeout };
    }
}
