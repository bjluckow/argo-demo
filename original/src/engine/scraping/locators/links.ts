import BaseWebpage from "@/engine/adapters/webpage";

export type LinkElementLocator = { pattern: string };

export async function extractLinkElement(
    webpage: BaseWebpage,
    locator: LinkElementLocator,
): Promise<string | undefined> {
    const link = webpage.getCurrentURL().href;
    const match = link.match(locator.pattern);

    return match ? match[1] : undefined;
}
