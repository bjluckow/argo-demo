import { Dispatch, SetStateAction } from "react";
import { CrawlParams } from "@/engine/crawl";
import {  NumericInput } from "@blueprintjs/core";

type CrawlInputProps = {
    crawlParams: CrawlParams;
    setCrawlParams: Dispatch<SetStateAction<CrawlParams>>;
    disable: boolean;
};

export default function CrawlInput({
    crawlParams,
    setCrawlParams,
    disable,
}: CrawlInputProps) {
    return (
        <div>
            <h1 className="text-center font-semibold">Crawl Parameters</h1>
            <div className="flex max-w-fit flex-col items-center gap-y-2 py-5">
                <div>
                    <h1>Max Visits Per Site</h1>
                    <NumericInput
                        placeholder="Enter max visits..."
                        value={crawlParams.maxVisits}
                        onValueChange={(valueAsNumber) =>
                            setCrawlParams((currentParams) => {
                                return {
                                    ...currentParams,
                                    maxVisits: valueAsNumber,
                                };
                            })
                        }
                        min={1}
                        disabled={disable}
                    />
                </div>
                <div>
                    <h1>Error Limit Per Site</h1>
                    <NumericInput
                        placeholder="Enter error limit..."
                        value={crawlParams.errorLimit}
                        onValueChange={(valueAsNumber) =>
                            setCrawlParams((currentParams) => {
                                return {
                                    ...currentParams,
                                    errorLimit: valueAsNumber,
                                };
                            })
                        }
                        min={1}
                        disabled={disable}
                    />
                </div>
                <div>
                    <h1>Skip Limit Per Site</h1>
                    <NumericInput
                        placeholder="Enter skip limit..."
                        value={crawlParams.skipLimit}
                        onValueChange={(valueAsNumber) =>
                            setCrawlParams((currentParams) => {
                                return {
                                    ...currentParams,
                                    skipLimit: valueAsNumber,
                                };
                            })
                        }
                        min={1}
                        disabled={disable}
                    />
                </div>
                <div>
                    <h1>Queue Limit Per Site</h1>
                    <NumericInput
                        placeholder="Enter queue limit..."
                        value={crawlParams.queueLimit}
                        onValueChange={(valueAsNumber) =>
                            setCrawlParams((currentParams) => {
                                return {
                                    ...currentParams,
                                    queueLimit: valueAsNumber,
                                };
                            })
                        }
                        min={1}
                        disabled={disable}
                    />
                </div>
            </div>
        </div>
    );
}
