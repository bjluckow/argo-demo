import BaseWebpage from "../adapters/webpage";
import { PageMetaLocator, extractMetaElement } from "./locators/meta";
import { PageElementLocator, extractElement } from "./locators/element";
import { PageElementGroupLocator, extractElementGroup } from "./locators/group";
import { WebDataCategory } from "./categories";
import { LinkElementLocator, extractLinkElement } from "./locators/links";

export type PageDataTarget = {
    dataLabel: string;
    category?: WebDataCategory;
} & (
    | {
          dataType: "meta";
          locator: PageMetaLocator;
      }
    | {
          dataType: "element";
          locator: PageElementLocator;
      }
    | {
          dataType: "elementGroup";
          locator: PageElementGroupLocator;
      }
    | { dataType: "fromLink"; locator: LinkElementLocator }
);

export type PageDataValue = Omit<PageDataTarget, "locator"> & {
    data: string | undefined | string[] | (string | undefined)[];
};

export async function extractDataTarget(
    webpage: BaseWebpage,
    insn: PageDataTarget,
): Promise<PageDataValue> {
    switch (insn.dataType) {
        case "meta":
            return {
                ...insn,
                data: await extractMetaElement(webpage, insn.locator),
            };
        case "element":
            return {
                ...insn,
                data: await extractElement(webpage, insn.locator), // May be undefined: catch later
            };

        case "elementGroup":
            return {
                ...insn,
                data: await extractElementGroup(webpage, insn.locator),
            };
        case "fromLink": {
            return {
                ...insn,
                data: await extractLinkElement(webpage, insn.locator),
            };
        }

        default: {
            throw new Error(`unknown datatype for target instruction`);
        }
    }
}
