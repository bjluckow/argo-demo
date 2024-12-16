// Feb. 25, 2024: Be careful when importing BROWSERS

import PuppeteerBrowserCore from "./core";
import PuppeteerBrowserNative from "./native";
import PuppeteerBrowserStealth from "./stealth";

// Accidentally pulling FullPuppetBrowser into a NextJS Frontend component will stop compilation
export type BrowserType = keyof typeof PUPPETEER_BROWSERS;

export const PUPPETEER_BROWSERS = {
    Native: PuppeteerBrowserNative,
    Core: PuppeteerBrowserCore,
    Stealth: PuppeteerBrowserStealth,
} as const;
