import BaseWebpage from "./webpage";

/**
 * Wrapper for a browser object (e.g., Puppeteer's "Browser")
 * Serves as an API to control the browser and multiple webpages
 *
 * TODO: Potentially implement functions to manage multiple webpages?
 */
export default interface BaseBrowser {
    init(): Promise<void>;

    newWebpage(): Promise<BaseWebpage>;

    close(): Promise<void>;

    isActive(): boolean;
}
