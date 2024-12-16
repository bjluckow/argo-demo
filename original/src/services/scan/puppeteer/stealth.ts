import { BROWSER_LOGGER } from "./utils/browserLogger";
import PuppeteerBrowser from "./base";
import PuppeteerWebpage from "./webpage";
import { Browser, PuppeteerLaunchOptions } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { DEFAULT_PUPPETEER_SETTINGS } from "./configs";

const log = BROWSER_LOGGER("Puppeteer-Stealth");

/**
 * Wrapper for Puppeteer Browser
 */

export default class PuppeteerBrowserStealth implements PuppeteerBrowser {
    private _browser?: Browser;
    private webpages: PuppeteerWebpage[] = [];

    async init(settings: PuppeteerLaunchOptions = DEFAULT_PUPPETEER_SETTINGS) {
        this._browser = await puppeteer.use(StealthPlugin()).launch(settings);
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
        this.webpages.push(webpage);

        return webpage;
    }

    async close() {
        await this.browser.close();
    }
}
