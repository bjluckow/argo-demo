import * as cheerio from "cheerio";
import { PageDataTarget, PageDataValue } from "./extract";
import { PageElementLocator } from "./locators/element";
import { PageElementGroupLocator } from "./locators/group";
import { PageMetaLocator } from "./locators/meta";

export function canParseTarget(dataTarget: PageDataTarget) {
    switch (dataTarget.dataType) {
        case "element": {
            return dataTarget.locator.selType === "css";
        }
        case "elementGroup": {
            return (
                dataTarget.locator.locType !== "range" &&
                dataTarget.locator.selType === "css"
            );
        }
        case "meta": {
            return true;
        }
    }
}

export async function parseHTML(
    html: string,
    dataTargets: PageDataTarget[],
): Promise<PageDataValue[]> {
    const $ = cheerio.load(html);
    const results: PageDataValue[] = [];

    for (const target of dataTargets) {
        try {
            let data: string | undefined | string[] | (string | undefined)[] =
                undefined;

            switch (target.dataType) {
                case "meta":
                    data = parseMeta($, target.locator);
                    break;
                case "element":
                    data = parseElement($, target.locator);
                    break;
                case "elementGroup":
                    data = parseElementGroup($, target.locator);
                    break;
            }

            results.push({
                data,
                ...target,
            });
        } catch (error) {
            console.error(`Error parsing data for ${target.dataLabel}:`, error);
        }
    }

    return results;
}

function parseMeta(
    $: cheerio.Root,
    locator: PageMetaLocator,
): string | string[] | undefined {
    if (locator.level === "doc") {
        switch (locator.docElement) {
            case "html": {
                return $.html();
            }
            case "links": {
                const links = $("a") // Select all <a> tags
                    .map((i, link) => $(link).attr("href") || "") // Extract the href attribute
                    .get() // Convert Cheerio object to an array
                    .map((href) => href.trim()); // Trim each href

                return links;
            }
            case "texts": {
                const texts = $("*") // Select all elements
                    .map((i, element) => $(element).text() || "") // Get text content of each element
                    .get() // Convert Cheerio object to an array
                    .map((text) => text.trim()); // Trim each text

                return texts;
            }
        }
    }

    // Assuming 'name' or 'property' attribute is used for locators in meta elements
    const content = $(`meta[${locator.level}="${locator}"]`).attr("content");
    return content || undefined;
}

function parseElement(
    $: cheerio.Root,
    locator: PageElementLocator,
): string | undefined {
    if (locator.selType === "css") {
        return $(locator.selText).text().trim();
    } else if (locator.selType === "xpath") {
        // XPath handling in Cheerio requires an additional library or custom logic
        return handleXPath($, locator.selText);
    }
    return undefined;
}

function parseElementGroup(
    $: cheerio.Root,
    locator: PageElementGroupLocator,
): string[] | (string | undefined)[] {
    switch (locator.locType) {
        case "all": {
            const elements = $(locator.selText);

            const data = elements.map((i, el) => $(el).text().trim()).get();
            return data;
        }
        case "static": {
            const data = locator.selTextList.map((sel) => {
                const text = $(sel).text().trim();
                return text ? text : undefined; // Include undefined to maintain index alignment if necessary
            });
            return data;
        }
        case "range": {
            throw new Error("Cannot parse range group locator");
        }
    }
}

function handleXPath($: cheerio.Root, xpath: string): string | undefined {
    throw new Error("Cannot parse XPath");
}
