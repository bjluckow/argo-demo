import BaseWebpage from "@/engine/adapters/webpage";
import { PageElementSelector } from "./selectors";
import { PageElementLocator, extractElement } from "./element";

// WEBPAGE ELEMENT GROUP

export type PageElementGroupLocator =
    | AllGroupLocator
    | StaticGroupLocator
    | RangeGroupLocator;

type AllGroupLocator = {
    locType: "all"; // CSS only, using querySelectorAll
} & Omit<PageElementSelector, "selType"> & { selType: "css" };

type StaticGroupLocator = {
    locType: "static";
    selTextList: PageElementSelector["selText"][];
} & Omit<PageElementSelector, "selText">;

type RangeGroupLocator = {
    locType: "range";
    selWildcard: string;
    lower: number;
    upper: number;
} & PageElementSelector;

export async function extractElementGroup(
    webpage: BaseWebpage,
    locator: PageElementGroupLocator,
): Promise<(string | undefined)[]> {
    switch (locator.locType) {
        case "all": {
            return extractGroupAll(webpage, locator);
        }
        case "static": {
            return extractGroupStatic(webpage, locator);
        }
        case "range": {
            return extractGroupRange(webpage, locator);
        }

        default: {
            throw new Error("unknown element group locator loctype");
        }
    }
}

async function extractGroupAll(
    webpage: BaseWebpage,
    allLocator: AllGroupLocator,
): Promise<string[]> {
    return webpage.findAllElementsCSS(allLocator.selText);
}

async function extractGroupStatic(
    webpage: BaseWebpage,
    staticLocator: StaticGroupLocator,
): Promise<(string | undefined)[]> {
    const { selTextList, selType } = staticLocator;
    const elementLocs: PageElementLocator[] = selTextList.map((selText) => {
        return { selText, selType };
    });

    const values: (string | undefined)[] = [];
    for (const elementLoc of elementLocs) {
        const value = await extractElement(webpage, elementLoc);
        values.push(value);
    }
    return values;
}

async function extractGroupRange(
    webpage: BaseWebpage,
    rangeLocator: RangeGroupLocator,
): Promise<(string | undefined)[]> {
    const { selType, selText, selWildcard, lower, upper } = rangeLocator;

    const [beforeWildcard, afterWildcard] = selText.split(selWildcard);
    const selTextList: string[] = [];
    for (let wildcardIdx = lower; wildcardIdx <= upper; wildcardIdx++) {
        selTextList.push(beforeWildcard + wildcardIdx + afterWildcard);
    }

    return extractGroupStatic(webpage, {
        locType: "static",
        selType,
        selTextList,
    });
}
