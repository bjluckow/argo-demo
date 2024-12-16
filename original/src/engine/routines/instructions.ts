import BaseWebpage from "../adapters/webpage";
import ScrapingCoreError from "../scraping/utils/ScrapingCoreError";
import { SCRAPING_LOGGER } from "../scraping/utils/scrapingLogger";
import {
    PageDataTarget,
    PageDataValue,
    extractDataTarget,
} from "../scraping/extract";
import {
    SUPPORTED_ACTION_TYPES,
    WebpageAction,
    executeWebpageAction,
} from "./actions";

const log = SCRAPING_LOGGER.getSubLogger({ name: "Instruction" });

export type PageInstruction = PageDataInstruction | PageActionInstruction;

export type PageDataInstruction = {
    insnType: "data";
    required?: boolean;
} & PageDataTarget;

export type PageActionInstruction = {
    insnType: "action";
} & WebpageAction;

/**
 * Extract data targets from the current state of the webpage's document
 */
export async function executeDataInstructions(
    webpage: BaseWebpage,
    dataInsns: PageDataInstruction[],
): Promise<PageDataValue[]> {
    const dataValues: PageDataValue[] = [];

    const hasValidData = (data: PageDataValue["data"]) => {
        if (Array.isArray(data)) {
            return data.filter((v) => v !== undefined).length > 0;
        } else {
            return data !== undefined;
        }
    };

    for (const insn of dataInsns) {
        try {
            const targetValue = await extractDataTarget(
                webpage,
                insn satisfies PageDataTarget,
            );

            if (insn.required === true && hasValidData(targetValue.data)) {
                throw new WebpageInstructionError(
                    WebpageInstructionErrorType.DataTargetInvalidResult,
                    { insn, partialData: dataValues },
                );
            }

            dataValues.push(targetValue);
        } catch (error) {
            if (error instanceof WebpageInstructionError) {
                throw error;
            }

            throw new WebpageInstructionError(
                WebpageInstructionErrorType.DataInsnFailed,
                { insn, partialData: dataValues },
                error as Error,
            );
        }
    }

    return dataValues;
}

/**
 * Manipulate the current state of the webpage's document with a series of actions
 */
export async function executeActionInstructions(
    webpage: BaseWebpage,
    actionInsns: PageActionInstruction[],
): Promise<void> {
    for (const insn of actionInsns) {
        try {
            // TODO: Delay noise to make actions appear natural
            const insnResult = await executeWebpageAction(
                webpage,
                insn satisfies WebpageAction,
            );

            if (!insnResult.success) {
                throw new WebpageInstructionError(
                    WebpageInstructionErrorType.ActionInsnUnsuccessful,
                    { insn },
                );
            }
        } catch (error) {
            if (error instanceof WebpageInstructionError) {
                throw error;
            }

            throw new WebpageInstructionError(
                WebpageInstructionErrorType.ActionInsnFailed,
                { insn },
                error as Error,
            );
        }
    }
}

// ERRORS

export enum WebpageInstructionErrorType {
    DataInsnFailed = "Data instruction failed to execute.",
    DataTargetInvalidResult = "Data target resulted in an invalid output.",
    ActionInsnFailed = "Action instruction failed to execute.",
    ActionInsnUnsuccessful = "Action instruction was executed but unsuccessful.",
}

type WebpageInstructionErrorContext = {
    insn: PageInstruction;
    partialData?: PageDataValue[];
};

export class WebpageInstructionError extends ScrapingCoreError<
    WebpageInstructionErrorType,
    WebpageInstructionErrorContext
> {
    constructor(
        public errorType: WebpageInstructionErrorType,
        public context: WebpageInstructionErrorContext,
        public error?: Error,
    ) {
        super(errorType, context, error);
        this.name = this.constructor.name;
        log.error(this.message);
    }
}

// UTILS

export type PageInstructionSerial =
    | {
          insnUUID: number;
          insnType: PageDataInstruction["insnType"]; // LITERAL: "data"
          insnSubtype: PageDataInstruction["dataType"];
      }
    | {
          insnUUID: number;
          insnType: PageActionInstruction["insnType"]; // LITERAL: "action"
          insnSubtype: PageActionInstruction["actionType"];
      };

export const DATA_INSN_SUBTYPES: PageDataTarget["dataType"][] = [
    "meta",
    "element",
    "elementGroup",
    "fromLink",
] as const;

export const ACTION_INSN_SUBTYPES: WebpageAction["actionType"][] =
    SUPPORTED_ACTION_TYPES;

export const SUPPORTED_INSNS_INFO: PageInstructionSerial[] = (() => {
    const dataInsnSerials: PageInstructionSerial[] = DATA_INSN_SUBTYPES.map(
        (st, idx) => {
            return {
                insnType: "data",
                insnSubtype: st,
                insnUUID: idx,
            } as const;
        },
    );

    const actionInsnSerials: PageInstructionSerial[] = ACTION_INSN_SUBTYPES.map(
        (st, idx) => {
            return {
                insnType: "action",
                insnSubtype: st,
                insnUUID: dataInsnSerials.length + idx,
            } as const;
        },
    );

    return [...dataInsnSerials, ...actionInsnSerials];
})();

export function getInstructionSerial(
    insnUUID: number,
): PageInstructionSerial | undefined {
    if (insnUUID < 0 || insnUUID >= SUPPORTED_INSNS_INFO.length) {
        return undefined;
    }
    return SUPPORTED_INSNS_INFO[insnUUID];
}

export function getInstructionParams(insn: PageInstruction): {
    paramName: string;
    paramType: string;
}[] {
    switch (insn.insnType) {
        case "data": {
            switch (insn.dataType) {
                case "meta": {
                    return [{ paramName: "label", paramType: "string" }];
                }
                case "element": {
                    return [
                        { paramName: "elementName", paramType: "string" },
                        { paramName: "cssOrXPath", paramType: "string" },
                    ];
                }
            }
        }
        case "action": {
            const params = Object.entries(insn).filter(
                ([k, v]) => k !== "actionType",
            );
            return params.map(([k, v]) => {
                return { paramName: k, paramType: typeof v };
            });
        }
    }
}
