import { BROWSER_LOGGER } from "./utils/browserLogger";
import PuppeteerBrowser from "./base";
import PuppeteerWebpage from "./webpage";
import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";

const log = BROWSER_LOGGER("Puppeteer");

const DEFAULT_SETTINGS: PuppeteerLaunchOptions = {
    // args: ["--disable-features=site-per-process"],
    headless: true,
};

/**
 * Wrapper for Puppeteer Browser
 */

export default class PuppeteerBrowserNative implements PuppeteerBrowser {
    private _browser?: Browser;
    private webpages: PuppeteerWebpage[] = [];

    async init(settings: PuppeteerLaunchOptions = DEFAULT_SETTINGS) {
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
