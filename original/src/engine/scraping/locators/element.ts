import BaseWebpage from "@/engine/adapters/webpage";
import { PageElementSelector } from "./selectors";

// WEBPAGE ELEMENT

export type PageElementLocator = PageElementSelector;
/**
 * If multiple selectors provided, try each one until an element is successfully found
 */
export async function extractElement(
    webpage: BaseWebpage,
    locator: PageElementLocator,
): Promise<string | undefined> {
    const selector = locator;
    try {
        switch (selector.selType) {
            case "css":
                return webpage.findElementCSS(locator.selText);
            case "xpath":
                return webpage.findElementXPath(locator.selText);
        }
    } catch (error) {
        throw error; // TODO
    }
}
