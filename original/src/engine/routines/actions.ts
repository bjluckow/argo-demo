import { SCRAPING_LOGGER } from "../scraping/utils/scrapingLogger";
import BaseWebpage from "@/engine/adapters/webpage";
import { PageElementSelector } from "../scraping/locators/selectors";

const log = SCRAPING_LOGGER.getSubLogger({ name: "Action" });

/**
 * Ideal workflow:
 * Need to overcome some hurdle on a webpage
 * Add functionality to BaseWebpage as needed
 * Create new 'Do' Instruction to pass params
 * Create handler function for insn
 */

export enum WebpageActionLabel {
    Click = "click",
    WaitFor = "waitFor",
}

export const SUPPORTED_ACTION_TYPES: WebpageAction["actionType"][] =
    Object.values(WebpageActionLabel).map(
        (action) => action.toString() as WebpageAction["actionType"],
    );

export type WebpageAction =
    | { actionType: WebpageActionLabel.Click; selector: PageElementSelector }
    | {
          actionType: WebpageActionLabel.WaitFor;
          selector: PageElementSelector;
      };

export type WebpageActionResult = {
    actionType: WebpageAction["actionType"];
    success: boolean;
};

export async function executeWebpageAction(
    webpage: BaseWebpage,
    insn: WebpageAction,
): Promise<WebpageActionResult> {
    // Route insn.type to handler function
    switch (insn.actionType) {
        case "click": {
            try {
                await webpage.click(insn.selector.selText);
                return {
                    actionType: WebpageActionLabel.Click,
                    success: true,
                };
            } catch (e) {
                return {
                    actionType: WebpageActionLabel.Click,
                    success: false,
                };
            }
        }
        default: {
            throw new Error(`unknown webpage action ${insn.actionType}`);
        }
    }
}
