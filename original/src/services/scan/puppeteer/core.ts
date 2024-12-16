import { BROWSER_LOGGER } from "./utils/browserLogger";
import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer"; // TODO: Change to puppeteer-core
import PuppeteerWebpage from "./webpage";
import { DEFAULT_PUPPETEER_SETTINGS } from "./configs";

const log = BROWSER_LOGGER("Puppeteer");

// TODO 11/15/24: THIS WAS COPIED FROM "NATIVE" AND DOES NOT USE CORE YET

/**
 * Wrapper class for puppeteer-core Browser
 */
export default class PuppeteerBrowserCore {
    private _browser?: Browser;
    private webpages: PuppeteerWebpage[] = [];

    async init(settings: PuppeteerLaunchOptions = DEFAULT_PUPPETEER_SETTINGS) {
        log.info("Launching browser...");
        this._browser = await puppeteer.launch(settings);
        log.info("Successfuly launched browser.");
    }

    isActive() {
        return this._browser ? true : false;
    }

    private get browser() {
        if (!this._browser) {
            throw new Error("puppeteer browser not initialized");
        }

        return this._browser;
    }

    async newWebpage(): Promise<PuppeteerWebpage> {
        const page = await this.browser.newPage();

        const id = this.webpages.length + 1;
        const webpage = new PuppeteerWebpage(page, id);

        return webpage;
    }

    async close() {
        await this.browser.close();
    }
}
