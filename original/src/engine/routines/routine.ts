import { SCRAPING_LOGGER } from "../scraping/utils/scrapingLogger";
import ScrapingCoreError from "../scraping/utils/ScrapingCoreError";
import BaseWebpage from "../adapters/webpage";
import { WebpageAction } from "./actions";
import { PageDataTarget, PageDataValue } from "../scraping/extract";
import {
    PageActionInstruction,
    PageDataInstruction,
    PageInstruction,
    WebpageInstructionError,
    executeDataInstructions,
    executeActionInstructions,
} from "./instructions";

const log = SCRAPING_LOGGER.getSubLogger({ name: "Routine" });

// Routine Param types

export type PageRoutine = PageRoutineStep[];

export type PageRoutineStep = {
    dataInsns: PageDataInstruction[];
    actionInsns?: PageActionInstruction[]; // Only compatible with browsers (ie not fetching)
};

export type PageRoutineResult = {
    values: PageDataValue[];
};

/**
 *  Preserves integrity of webpage's data by manipulating the state in step by step
 *
 *  A step of a routine should consist of a set of data targets to extract from a webpage state,
 *  and as set of webpage manipulations ("actions") needed to achieve that state (ideally)
 */
export async function executeWebpageRoutine(
    webpage: BaseWebpage,
    routine: PageRoutine,
): Promise<PageRoutineResult> {
    const totalData: PageDataValue[] = [];

    let stepNum = 0;
    for (const step of routine) {
        try {
            const stepData = await executeRoutineStep(webpage, step);
            totalData.push(...stepData);
            stepNum++;
        } catch (error) {
            const context = {
                partialData: totalData,
                stepNum,
            };

            if (error instanceof WebpageInstructionError) {
                // Catch first instruction that fails and return partial result
                throw new WebpageRoutineError(
                    WebpageRoutineErrorType.InstructionFailed,
                    context,
                    error,
                );
            } else {
                throw new WebpageRoutineError(
                    WebpageRoutineErrorType.Unknown,
                    context,
                    error as Error,
                );
            }
        }
    }
    return { values: totalData };
}

async function executeRoutineStep(
    webpage: BaseWebpage,
    routineStep: PageRoutineStep,
): Promise<PageDataValue[]> {
    if (routineStep.actionInsns) {
        // First execute actions to change state all at once
        await executeActionInstructions(webpage, routineStep.actionInsns);
    }
    // Then extract elements that have appeared on page
    const extractedData = await executeDataInstructions(
        webpage,
        routineStep.dataInsns,
    );

    return extractedData;
}

export enum WebpageRoutineErrorType {
    Unknown = "An unknown error occurred in the webpage routine.",
    InstructionFailed = "An instruction failed to execute properly in the webpage routine.",
}

type WebpageRoutineErrorContext = {
    partialData: PageDataValue[];
    stepNum: number;
};

export class WebpageRoutineError extends ScrapingCoreError<
    WebpageRoutineErrorType,
    WebpageRoutineErrorContext
> {
    constructor(
        public errorType: WebpageRoutineErrorType,
        public context: WebpageRoutineErrorContext,
        public error?: Error,
    ) {
        super(errorType, context, error); // Using the enum's value directly
        this.name = this.constructor.name;
        log.error(this.message);
    }
}
