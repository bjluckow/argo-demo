import { SCRAPING_LOGGER } from "./utils/scrapingLogger";
import ScrapingCoreError from "./utils/ScrapingCoreError";
import BaseWebpage from "../adapters/webpage";
import { WebAuth } from "../requests/auth";
import Fetcher from "../requests/Fetcher";
import {
    PageRoutine,
    executeWebpageRoutine,
    WebpageRoutineError,
} from "../routines/routine";
import { PageDataTarget, PageDataValue } from "./extract";
import { parseHTML } from "./parse";
import { FetchResponse } from "../requests/fetch";

const log = SCRAPING_LOGGER.getSubLogger({ name: `Scrape` });

export type ScrapeParams = {
    routine: PageRoutine;
    userAgent: string;
    timeout: number;
    auth?: WebAuth;
    useStealth?: boolean;
};

export type ScrapeResult = {
    // Request info
    reqMethod: "browser" | "fetch";
    status: number;
    // Page info
    pageLink: string;
    pageTitle?: string;
    // Stats
    startTime: number;
    endTime: number;
    // Data
    scrapedData?: ScrapedData;
    robotsText?: string;
    sitemapIndexedLinks?: string[];
    sitemapListedLinks?: string[];
};

export async function scrapeWithWebpage(
    url: URL,
    webpage: BaseWebpage,
    params: ScrapeParams,
): Promise<ScrapeResult> {
    const { routine, userAgent, timeout, useStealth } = params;

    const startTime = Date.now();
    try {
        // NOTE: Setting UA must immediately precede webpage.navigateTo()
        await webpage.setUserAgent(userAgent);

        log.debug(`Webpage navigating to '${url.href}...' `);
        const respStatus = await webpage.navigateTo(url, timeout);

        if (respStatus !== 200) {
            throw new ScrapeError(ScrapeErrorType.NavBadResponse, {
                url,
                params,
                startTime,
                routine,
                respStatus,
            });
        }

        const pageTitle = await webpage.getCurrentTitle();

        log.debug(`Webpage executing routine for ${url.href}...`);
        const { values: routineData } = await executeWebpageRoutine(
            webpage,
            routine,
        );

        const scrapedData = processDataValues(routineData);
        log.debug(
            `Webpage scraped ${Object.entries(routineData).length} data elements from ${url.href}`,
        );

        return {
            reqMethod: "browser",
            status: respStatus,
            pageLink: url.href,
            pageTitle,
            startTime,
            endTime: Date.now(),
            scrapedData,
        };
    } catch (error) {
        if (error instanceof ScrapeError) {
            throw error;
        }

        const partialData =
            error instanceof WebpageRoutineError
                ? processDataValues(error.context.partialData)
                : { values: [], badLabels: [] };

        throw new ScrapeError(
            undefined, // Error class will infer type
            {
                url,
                params,
                startTime,
                partialData,
            },
            error as Error,
        );
    }
}

export async function scrapeWithFetcher(
    url: URL,
    fetcher: Fetcher,
    params: ScrapeParams,
): Promise<ScrapeResult> {
    const { routine, userAgent, auth } = params;

    const startTime = Date.now();
    try {
        log.info(`(FETCH) Sending request to '${url.href}'`);

        const { link, status, content } = await fetcher.fetchPage(
            url,
            userAgent,
            auth?.creds,
        );

        const dataTargets: PageDataTarget[] = routine[0]
            .dataInsns satisfies PageDataTarget[];
        const values = await parseHTML(content, dataTargets);
        const scrapedData = processDataValues(values);

        // TODO: page title?

        return {
            reqMethod: "browser",
            status,
            pageLink: link,
            startTime,
            endTime: Date.now(),
            scrapedData,
        };
    } catch (error) {
        if (error instanceof ScrapeError) {
            throw error;
        }

        const partialData =
            error instanceof WebpageRoutineError
                ? processDataValues(error.context.partialData)
                : { values: [], badLabels: [] };

        throw new ScrapeError(
            undefined, // Error class will infer type
            {
                url,
                params,
                startTime,
                partialData,
            },
            error as Error,
        );
    }
}

// PROCESS DATA

export type ScrapedData = {
    values: ScrapedDataValue[];
    badLabels: string[];
};

export type ScrapedDataValue = Omit<PageDataValue, "data" | "dataType"> & {
    data: string;
};

/**
 * Group data categories, remove undefined values
 * This function assumes that WebpageDataTargetValue includes `data`, `dataLabel`, and `category`,
 * and that `data` can be undefined. The function will filter out such undefined `data` values.
 *
 * Data should not be undefined if dataType is 'element'
 * Undefined values from dataType 'elementGroup' is acceptable
 */

function processDataValues(extractedValues: PageDataValue[]): ScrapedData {
    const scrapedData: ScrapedData = {
        values: [],
        badLabels: [],
    };

    for (const value of extractedValues) {
        // Ensure we handle the case where data might be undefined
        const valueData = value.data;

        if (valueData && Array.isArray(valueData)) {
            valueData.forEach((d, idx) => {
                const indexedLabel = value.dataLabel + "-" + idx;
                if (d) {
                    scrapedData.values.push({
                        dataLabel: indexedLabel,
                        data: d,
                        category: value.category,
                    });
                } else {
                    scrapedData.badLabels.push(indexedLabel);
                }
            });
        } else if (valueData) {
            const newValue: ScrapedDataValue = {
                ...value,
                category: value.category,
                data: valueData, // Explicitly set data even if it's redundant to satisfy Required<>
            };

            scrapedData.values.push(newValue);
        } else {
            scrapedData.badLabels.push(value.dataLabel);
        }
    }

    return scrapedData;
}

// ERRORS

export enum ScrapeErrorType {
    Unknown = "Unknown",
    RoutineFailed = "Routine Failed",
    NavTimeout = "Navigation Timeout",
    NavBadResponse = "Navigation Bad Response",
    RobotsFetch = "Robots.txt Fetch Error",
    SitemapFetch = "Sitemap Fetch Error",
    SitemapInvalid = "Invalid Sitemap",
}

type ScrapeErrorContext = {
    url: URL;
    params: ScrapeParams;
    startTime: number;
    auth?: WebAuth | undefined;
    routine?: PageRoutine;
    respStatus?: number;
    respText?: string;
    partialData?: ScrapedData;
};

export class ScrapeError extends ScrapingCoreError<
    ScrapeErrorType,
    ScrapeErrorContext
> {
    constructor(
        errorType: ScrapeErrorType | undefined,
        public context: ScrapeErrorContext,
        public caughtError?: Error,
    ) {
        super(
            ScrapeError.inferErrorType(errorType, caughtError),
            context,
            caughtError,
        );
        this.name = this.constructor.name;
        log.error(this.message); // assuming `log.error` is equivalent to `console.error` in this example
    }

    private static inferErrorType(
        errorType?: ScrapeErrorType,
        caughtError?: Error,
    ): ScrapeErrorType {
        if (errorType) {
            return errorType;
        }

        if (!caughtError) {
            return ScrapeErrorType.Unknown;
        } else if (caughtError instanceof WebpageRoutineError) {
            return ScrapeErrorType.RoutineFailed;
        }  else {
            return ScrapeErrorType.Unknown;
        }
    }
}
