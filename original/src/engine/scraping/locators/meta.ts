import BaseWebpage from "@/engine/adapters/webpage";

export enum PageDocumentElement {
    Links = "links",
    Texts = "texts",
    HTML = "html",
}

export type PageMetaLocator =
    | {
          level: "doc";
          docElement: PageDocumentElement;
      }
    | { level: "property"; text: string }
    | { level: "name"; text: string }
    | { level: "time" };

export async function extractMetaElement(
    webpage: BaseWebpage,
    locator: PageMetaLocator,
): Promise<string | string[] | undefined> {
    switch (locator.level) {
        case "doc": {
            return extractDocLevelData(webpage, locator.docElement);
        }

        case "property": {
            return await webpage.findElementCSS(
                `meta[property="${locator.text}"]`,
            );
        }
        case "name": {
            return await webpage.findElementCSS(`meta[name="${locator.text}"]`);
        }
        case "time": {
            const timeData = await webpage.getDateElement();
            return JSON.stringify([
                timeData.datetime?.toISOString() ?? "null",
                timeData.content ?? "null",
            ]);
        }
        default: {
            throw new Error("Unknown meta element metaType");
        }
    }
}

async function extractDocLevelData(
    webpage: BaseWebpage,
    docDataLabel: PageDocumentElement,
) {
    switch (docDataLabel) {
        case PageDocumentElement.Links: {
            return webpage.getAllCurrentLinks();
        }
        case PageDocumentElement.Texts: {
            return webpage.getAllCurrentTexts();
        }
        case PageDocumentElement.HTML: {
            return webpage.getCurrentHTML();
        }
        default: {
            throw new Error(
                `Cannot extract webpage meta element: unknown locator ${JSON.stringify(docDataLabel)}`,
            );
        }
    }
}
