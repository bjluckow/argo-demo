import { PuppeteerLaunchOptions } from "puppeteer";

export const DEFAULT_PUPPETEER_SETTINGS: PuppeteerLaunchOptions = {
    // args: ["--disable-features=site-per-process"],
    headless: true,
};
