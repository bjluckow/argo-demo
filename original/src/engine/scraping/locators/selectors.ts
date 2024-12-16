import BaseWebpage from "@/engine/adapters/webpage";

export type PageElementSelector =
    | { selType: "css"; selText: string }
    | { selType: "xpath"; selText: string };

const CSS_SELECTOR_REGEX: RegExp = /^(\s*(#[\w-]+|\.[\w-]+|\w+)+\s*(>|$))/;
const XPATH_SELECTOR_REGEX: RegExp =
    /^\/(?:\w+\/)*\w+(?:\[\d+\])?(?:\/\w+(?:\[\d+\])?)*$/;

export function classifySelector(selector: string): PageElementSelector {
    if (CSS_SELECTOR_REGEX.test(selector)) {
        return { selType: "css", selText: selector };
    } else if (XPATH_SELECTOR_REGEX.test(selector)) {
        return { selType: "xpath", selText: selector };
    } else {
        throw new InvalidSelectorError(
            `Could not parse '${selector}' as CSS or XPath selector`,
            selector,
        );
    }
}

export class InvalidSelectorError extends Error {
    selector: string;
    constructor(msg: string, selector: string) {
        super(msg);
        this.selector = selector;
    }
}

export async function findElementOnWebpage(
    webpage: BaseWebpage,
    selector: string,
): Promise<string | undefined> {
    // Throws InvalidSelectorError
    const parsedSelector = classifySelector(selector);

    switch (parsedSelector.selType) {
        case "css":
            return webpage.findElementCSS(parsedSelector.selText);
        case "xpath":
            return webpage.findElementXPath(parsedSelector.selText);
    }
}

export async function waitForElementOnWebpage(
    webpage: BaseWebpage,
    selector: string,
    timeoutMS: number,
): Promise<void> {
    // Throws InvalidSelectorError
    const parsedSelector = classifySelector(selector);

    switch (parsedSelector.selType) {
        case "css":
            return webpage.waitForSelectorCSS(
                parsedSelector.selText,
                timeoutMS,
            );
        case "xpath":
            return webpage.waitForSelectorXPath(
                parsedSelector.selText,
                timeoutMS,
            );
    }
}
