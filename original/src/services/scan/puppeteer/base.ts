import BaseBrowser from "../../../engine/adapters/browser";
import PuppeteerWebpage from "./webpage";
import { PuppeteerLaunchOptions } from "puppeteer";

export default abstract class PuppeteerBrowser implements BaseBrowser {
    abstract init(settings?: PuppeteerLaunchOptions): Promise<void>;

    abstract isActive(): boolean;

    abstract newWebpage(): Promise<PuppeteerWebpage>;

    abstract close(): Promise<void>;
}
