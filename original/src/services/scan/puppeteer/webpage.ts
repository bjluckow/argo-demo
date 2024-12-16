import { BROWSER_LOGGER } from "./utils/browserLogger";
import BaseWebpage, { WebpageDate } from "@/engine/adapters/webpage";
import { Page } from "puppeteer"; // todo: may have to do use different types for different versions

const log = BROWSER_LOGGER("WEBPAGE");

/**
 * Wrapper class for Puppeteer Page
 */

export default class PuppeteerWebpage implements BaseWebpage {
    private page: Page;

    private pageID: number;

    constructor(page: Page, pageID: number) {
        this.page = page;
        this.pageID = pageID;
    }

    getID(): number {
        return this.pageID;
    }

    private log(msg: string): void {
        log.debug(`[#${this.pageID}] ${msg}`);
    }

    isActive(): boolean {
        return !this.page.isClosed();
    }

    // CONTROLS

    async navigateTo(url: URL, timeout?: number): Promise<number> {
        this.log(`Navigating to ${url.href}...`);
        const resp = await this.page.goto(url.href, { timeout });

        const status = resp?.status();
        this.log(
            `Navigated to ${url.href}. (Status: ${status ?? "NO STATUS -- DEFAULT 418"})`,
        );

        return status ?? 200; // No status means we haven't moved
    }

    async close() {
        this.log("Closing webpage...");
        await this.page.close();
        this.log("Closed webpage.");
    }

    async setUserAgent(ua: string): Promise<void> {
        this.log(`Setting user agent to ${ua}...`);
        await this.page.setUserAgent(ua);
        this.log(`Set user agent to ${ua}.`);
    }

    async authenticateHTTP(
        username: string,
        password: string,
    ): Promise<boolean> {
        throw new Error("unimpl");
    }

    // EXTRACT PAGE DATA

    getCurrentURL(): URL {
        return new URL(this.page.url());
    }

    async getCurrentHTML() {
        const html: string = await this.page.evaluate(() => {
            const html = document.querySelector("*")!.outerHTML; // TODO: Handle null
            if (!html) throw new Error("No HTML Extracted");

            return html;
        });

        return html;
    }

    async getCurrentTitle(): Promise<string> {
        return await this.page.title();
    }

    async getAllCurrentLinks(): Promise<string[]> {
        const links: string[] = await this.page.$$eval("a", (links) =>
            links.map((link) => link.href.trim()),
        );

        return links;
    }

    async getAllCurrentTexts(): Promise<string[]> {
        const texts: string[] = await this.page.$$eval("*", (elements) =>
            elements.map((element) => (element.textContent ?? "").trim()),
        );

        return texts;
    }

    async getDateElement(): Promise<WebpageDate> {
        const timeElements = await this.page.evaluate(() => {
            const times = Array.from(document.querySelectorAll("time"));
            return times.map((timeElement) => ({
                datetime: timeElement.getAttribute("datetime") ?? undefined,
                content: timeElement.textContent ?? undefined,
            }));
        });

        return timeElements[0] as WebpageDate;
    }
    // EXTRACT DATA ELEMENTS / FIND SELECTORS

    async findElementCSS(selector: string): Promise<string | undefined> {
        const elementHandle = await this.page.$(selector);
        if (!elementHandle) return undefined;

        const contentAttribute = await elementHandle.evaluate((element) =>
            element.getAttribute("content"),
        );
        return contentAttribute !== null
            ? contentAttribute
            : elementHandle.evaluate((node) => node.textContent || undefined);
    }

    async findAllElementsCSS(selector: string): Promise<string[]> {
        const elements = await this.page.$$(selector);
        if (!elements.length) return [];

        const results = await Promise.all(
            elements.map(async (element) => {
                const contentAttribute = await element.evaluate((node) =>
                    node.getAttribute("content"),
                );
                return contentAttribute !== null
                    ? contentAttribute
                    : await element.evaluate((node) => node.textContent || "");
            }),
        );

        return results.filter((text) => text); // Optionally filter out empty strings
    }

    async findElementXPath(selector: string): Promise<string | undefined> {
        throw new Error('deprecated')
        // try {
        //     const elementHandle = await this.page.$x(selector);
        //     if (elementHandle.length === 0) return undefined;

        //     const contentAttribute = await elementHandle[0].evaluate((node) => {
        //         if (node instanceof HTMLElement) {
        //             return node.getAttribute("content");
        //         } else {
        //             return null;
        //         }
        //     });

        //     return contentAttribute !== null
        //         ? contentAttribute
        //         : elementHandle[0].evaluate(
        //               (node) => node.textContent || undefined,
        //           );
        // } catch (error) {
        //     console.error("Error finding element by XPath:", error);
        //     return undefined;
        // }
    }

    async waitForSelectorCSS(selector: string, timeout: number): Promise<void> {
        await this.page.waitForSelector(selector, { timeout });
    }

    async waitForSelectorXPath(
        selector: string,
        timeout: number,
    ): Promise<void> {
        throw new Error('deprecated')
        // await this.page.waitForXPath(selector, { timeout });
    }

    // DOM INTERACTION

    async click(selector: string): Promise<void> {
        await this.page.click(selector);
    }
}
