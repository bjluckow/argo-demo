import { MAIN_LOGGER } from "./utils/mainLogger";
import { sanitizeLinksIntoURLs } from "./utils/sanitizeLinks";
import { mergeSettings } from "./scraping/utils/mergeSettings";
import { WebDataCategory } from "./scraping/categories";
import { PageDocumentElement } from "./scraping/locators/meta";
import { PageRoutine } from "./routines";

const log = MAIN_LOGGER.getSubLogger({ name: "Crawl" });

export type CrawlParams = {
    maxVisits: number;
    followLinks: boolean;
    requireRoutines: boolean;
    queueLimit: number;
    errorLimit: number;
    skipLimit: number;
};

export type CrawlResult<R> = {
    completed: boolean;
    startTime: number;
    endTime: number;
    pageResults: R[];
    unvisitedLinks: string[];
    errors: CrawlingError[];
};

// CONSTS

export const DEFAULT_CRAWL_PARAMS: Required<CrawlParams> = {
    maxVisits: 5,
    followLinks: true,
    requireRoutines: false,
    queueLimit: 20000,
    errorLimit: 5,
    skipLimit: 20000,
} as const;

export const DEFAULT_CRAWL_ROUTINE: PageRoutine = [
    {
        // Scrapes links for further crawling
        dataInsns: [
            {
                insnType: "data",
                dataType: "meta",
                dataLabel: "links",
                locator: {
                    level: "doc",
                    docElement: PageDocumentElement.Links,
                },
                category: WebDataCategory.Links,
            },
        ],
    },
] as const;

// CRAWL FUNCTIONS

/**
 * TODO: Fast queue implementation
 */
export async function crawlURLs<R>(
    seedURLs: URL[],
    crawlParams: Partial<CrawlParams>,
    resultProducer: (url: URL) => Promise<R | undefined>,
    linkProducer?: (_: R) => string[],
    terminationChecker?: () => boolean,
): Promise<CrawlResult<R>> {
    const params = mergeSettings(DEFAULT_CRAWL_PARAMS, crawlParams);

    const maxVisits =
        params.maxVisits ?? // FIXME: Somehow still manages to be undefined
        DEFAULT_CRAWL_PARAMS.maxVisits;

    const urlQueue: URL[] = seedURLs.slice(0, params.queueLimit); // TODO: enqueue/dequeue efficiency
    const results: R[] = [];

    const visitedLinks = new Set<string>(); // Track for skips
    const unvisitedLinks = new Set<string>(); // Queue overflow
    const skippedLinks = new Set<string>();
    const failedLinks = new Set<string>(); // Track for skips
    const errors: CrawlingError[] = [];

    const shouldEndEarly: boolean =
        urlQueue.length === 0 ||
        errors.length >= params.errorLimit ||
        skippedLinks.size >= params.skipLimit ||
        (terminationChecker !== undefined && terminationChecker());

    // EXECUTE: START CRAWL

    const startTime = Date.now();
    log.info(
        `START CRAWL [${seedURLs.length} seed links | ${params.maxVisits} page visit limit]`,
    );

    while (visitedLinks.size < maxVisits && !shouldEndEarly) {
        // POP NEXT URL, TERMINATE if no more URLs
        const url = urlQueue.shift(); // TODO: inefficient dequeueing
        if (!url) {
            break;
        }

        // SKIP IF ALREADY SEEN LINK (or other conditions)

        const shouldSkip =
            visitedLinks.has(url.href) ||
            skippedLinks.has(url.href) ||
            failedLinks.has(url.href);

        if (shouldSkip) {
            skippedLinks.add(url.href);
            log.debug(`Skipped '${url.href}' (${skippedLinks.size} skips)`);
            continue;
        }

        // VISIT URL AND SCRAPE
        const visitStartTime = Date.now();
        try {
            log.info(
                `Crawling link ${visitedLinks.size + 1}/${maxVisits} (${skippedLinks.size} skipped, ${failedLinks.size} failed)`,
            );

            const pageResult = await resultProducer(url); // Undefined -> url skipped
            if (!pageResult) {
                // Mark link as "skipped" if no page result
                skippedLinks.add(url.href);
                log.warn(
                    `Link '${url.href}' skipped -- did not produce page result `,
                );
                continue;
            }

            visitedLinks.add(url.href);
            results.push(pageResult);

            // Enqueue scraped links if necessary/possible
            if (
                linkProducer !== undefined &&
                params.followLinks &&
                urlQueue.length < params.queueLimit
            ) {
                const links: string[] = linkProducer(pageResult);
                const validURLs: URL[] = sanitizeLinksIntoURLs(links).validURLs;

                const capacity = params.queueLimit - urlQueue.length;
                const enqueueURLs = validURLs.slice(0, capacity);
                const storeURLs = validURLs.slice(capacity);

                urlQueue.push(...enqueueURLs);
                storeURLs.forEach((url) => unvisitedLinks.add(url.href));

                if (enqueueURLs.length > 0) {
                    log.debug(
                        `Pushed ${enqueueURLs.length} links from current webpage to crawl queue (${urlQueue.length}/${maxVisits} total)`,
                    );
                }
            }
        } catch (error) {
            failedLinks.add(url.href);
            errors.push(
                new CrawlingError(
                    url,
                    error as Error,
                    visitStartTime,
                    Date.now(),
                ),
            );

            log.error(
                `Link '${url.href}' failed (${failedLinks.size} failures)`,
            );
        }
        log.info(`Crawled link ${visitedLinks.size}/${maxVisits}`);

        if (errors.length >= params.errorLimit) {
            log.fatal(
                `Crawl has reached failure limit (${errors.length}/${params.errorLimit}) and terminated early.`,
            );
            break;
        }

        if (urlQueue.length <= 0) {
            log.warn(`Crawl has emptied queue and terminated early.`);
            break;
        }
    }

    const completed = !shouldEndEarly;
    log.info(
        `END CRAWL: Crawled ${visitedLinks.size}/${maxVisits} links ( ${completed ? "Completed" : "Terminated early"}, ${urlQueue.length} unvisited, ${failedLinks.size} failed, ${errors.length} errors)`,
    );

    return {
        completed,
        startTime,
        endTime: Date.now(),
        pageResults: results,
        unvisitedLinks: [
            ...urlQueue.map((url) => url.href),
            ...Array.from(unvisitedLinks),
        ],
        errors,
    };
}

// ERRORS

export class CrawlingError extends Error {
    constructor(
        public crawledURL: URL,
        public caughtError: Error,
        public visitStartTime: number,
        public catchTime: number,
    ) {
        super("Crawling Error: " + caughtError.message);
        this.name = this.constructor.name;
        log.error(
            `Caught error while crawling ${crawledURL.href}: ${caughtError.message}`,
        );
    }
}
