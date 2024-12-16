import { SCRAPING_LOGGER } from "./scrapingLogger";

const log = SCRAPING_LOGGER.getSubLogger({ name: "delay" });

export async function waitForDelay(
    startTime: number,
    minDelayMS: number,
    verbose = false,
): Promise<void> {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    verbose &&
        log.debug(
            `(DELAY) Current time: ${currentTime}, Start time: ${startTime}, Elapsed time: ${elapsedTime}, Required Delay: ${minDelayMS}`,
        );

    if (elapsedTime < minDelayMS) {
        const waitTimeMS = minDelayMS - elapsedTime;
        verbose && log.debug(`(DELAY) Waiting for additional ${waitTimeMS} ms`);
        await delay(waitTimeMS);
        verbose && log.debug(`(DELAY) Wait completed at ${Date.now()}`);
    } else {
        verbose &&
            log.debug("(DELAY) No wait needed, proceeding with execution.");
    }
}

export async function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

// /**
//  * Ensures that minDelay milliseconds have passed since the startTime
//  * If minDelay milliseconds have not passed, delay until they have
//  */
// export async function waitForDelay(
//     startTime: number,
//     minDelayMS: number,
// ): Promise<void> {
//     const elapsedTime = Date.now() - startTime;
//     if (elapsedTime < minDelayMS) {
//         const waitTimeMS = minDelayMS - elapsedTime;
//         await delay(waitTimeMS);
//     }
// }

// export async function delay(ms: number): Promise<void> {
//     return new Promise<void>((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }
