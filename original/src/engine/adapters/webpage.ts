export type WebpageHTML = string;
export type WebpageTitle = string;
export type WebpageLinks = string[];
export type WebpageTexts = string[];
export type WebpageDate = { datetime?: Date; content?: string };

/**
 * Wrapper for browser webpage object (e.g., Puppeteer's "Page")
 * Serves as a unified API for controlling the webpage, extracting data, and manipulating the DOM
 *
 * When implementing serializable instructions, the instruction handler should interact with a page via these functions
 */
export default interface BaseWebpage {
    // Control methods

    isActive(): boolean;

    navigateTo(url: URL, timeout?: number): Promise<number>;

    close(): Promise<void>;

    authenticateHTTP(username: string, password: string): Promise<boolean>;

    setUserAgent(userAgent: string): Promise<void>;

    // Common Data Getters

    getCurrentURL(): URL;

    getCurrentTitle(): Promise<WebpageTitle>;

    getCurrentHTML(): Promise<WebpageHTML>;

    getAllCurrentLinks(): Promise<WebpageLinks>;

    getAllCurrentTexts(): Promise<WebpageTexts>;

    getDateElement(): Promise<WebpageDate>;

    // Finding Elements

    findElementCSS(selector: string): Promise<string | undefined>;

    findAllElementsCSS(selector: string): Promise<string[]>;

    findElementXPath(selector: string): Promise<string | undefined>;

    // Waiting For Elements

    waitForSelectorCSS(selector: string, timeout: number): Promise<void>;

    waitForSelectorXPath(selector: string, timeout: number): Promise<void>;

    // DOM Interaction

    click(selector: string): Promise<void>;
}
