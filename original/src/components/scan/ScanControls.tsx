import { useState } from "react";
import {
    serverRunBacklogScan,
    serverRunLinkScan,
    serverRunIndexScan,
    serverRunFrontpageScan,
} from "@/app/_api/scanAPI";
import { ScanPayload } from "@/services/scan/engine";
import { DomainModel } from "@/db/models";
import { CrawlParams } from "../../engine/crawl";
import CrawlInput from "./CrawlInput";
import ScanInput from "./ScanInput";
import {
    Intent,
    TextArea, Button
} from "@blueprintjs/core";



const DEFAULT_MAX_VISITS = 100;
const DEFAULT_MIN_CRAWL = 5; // TODO: Somehow get this from /engine

type ScanControls = {
    selectedDomains: DomainModel[];
    setPayload: (payload: ScanPayload) => void;
};

const DEFAULT_CRAWL_PARAMS: Required<CrawlParams> = {
    maxVisits: 5,
    followLinks: true, // Does not need to be set here
    requireRoutines: false, // Does not need to be set here
    queueLimit: 20000,
    errorLimit: 5,
    skipLimit: 20000,
} as const;

export default function ScanControls({
    selectedDomains,
    setPayload,
}: ScanControls) {
    const [isTaskActive, setTaskActive] = useState<boolean>(false);
    const [crawlParams, setCrawlParams] =
        useState<CrawlParams>(DEFAULT_CRAWL_PARAMS);
    const [inputLinks, setInputLinks] = useState<string>();
    const [timeLimit, setTimeLimit] = useState<string>();

    // CONSTS

    const selectedDomainIDs: number[] = selectedDomains.map((d) => d.domainID);

    const { valid: validLinks, invalid: invalidLinks } =
        splitAndSanitizeLinkString(inputLinks ?? "");

    const canClickScan = !isTaskActive && selectedDomains.length > 0;
    const canClickScanWithSeeds =
        canClickScan && inputLinks && inputLinks !== "";

    // HANDLERS

    // Generic async operation handler
    const handleWebScanAction = async (serverAction: () => Promise<ScanPayload>) => {
        if (isTaskActive) return;
        setTaskActive(true);
        try {
            const payloadResult = await serverAction();
            setPayload(payloadResult);
        } catch (error) {
            console.error("Web scan operation failed:", error);
            // Handle error appropriately
        }
        setTaskActive(false);
        // Reset states if needed
        setInputLinks("");
    };

    return (
        <div className="ml-5 flex min-h-[30vh] flex-col">
            <div className="flex flex-row">
                <div className="flex min-w-72 flex-col gap-y-2 p-5">
                    <ScanInput
                        crawlParams={crawlParams}
                        setCrawlParams={setCrawlParams}
                        disable={isTaskActive}
                    />
                </div>
                <div className="min-w-72 p-5">
                    <CrawlInput
                        crawlParams={crawlParams}
                        setCrawlParams={setCrawlParams}
                        disable={isTaskActive}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center">
                <div className="flex w-full flex-col items-center gap-y-2 p-5">
                    <h1 className="font-semibold">Input Seed Links</h1>
                    <TextArea
                        placeholder="Separate links with a comma"
                        value={inputLinks ?? ""}
                        onChange={(event) => {
                            const newValue = event.target.value;
                            setInputLinks(newValue);
                        }}
                        intent={
                            invalidLinks.length > 0 && invalidLinks[0] !== ""
                                ? Intent.DANGER
                                : Intent.NONE
                        }
                        disabled={isTaskActive}
                        autoResize={true}
                        fill={true}
                    />
                    {validLinks.length > 0 && (
                        <p className="flex flex-col">
                            {validLinks.length} valid links
                        </p>
                    )}
                    {invalidLinks.length > 0 && invalidLinks[0] !== "" && (
                        <p className="link-paragraph">
                            Invalid links:{" "}
                            {invalidLinks.map((link, index) => (
                                <span key={index} className="link-tag">
                                    {link}
                                </span>
                            ))}
                        </p>
                    )}
                    <div className="flex min-w-72 flex-row items-center gap-x-2 px-10">
                        <Button
                            className="w-32"
                            disabled={!canClickScanWithSeeds}
                            onClick={() =>
                                validLinks.length > 0 &&
                                handleWebScanAction(() =>
                                    serverRunLinkScan(
                                        selectedDomainIDs,
                                        validLinks,
                                        {
                                            ...crawlParams,
                                            followLinks: false,
                                        },
                                    ),
                                )
                            }
                        >
                            Scrape {validLinks.length} Links
                        </Button>
                        <Button
                            className="w-32"
                            disabled={!canClickScanWithSeeds}
                            onClick={() =>
                                validLinks.length > 0 &&
                                handleWebScanAction(() =>
                                    serverRunLinkScan(
                                        selectedDomainIDs,
                                        validLinks,
                                        {
                                            ...crawlParams,
                                            followLinks: true,
                                            requireRoutines: false,
                                        },
                                    ),
                                )
                            }
                        >
                            Crawl{" "}
                            {crawlParams.maxVisits * selectedDomains.length}{" "}
                            links
                        </Button>
                    </div>
                </div>

                <div className="flex min-w-72 flex-row items-center gap-x-2 px-10 py-3">
                    <Button
                        className="w-32"
                        disabled={!canClickScan}
                        onClick={() =>
                            handleWebScanAction(() =>
                                serverRunBacklogScan(
                                    selectedDomainIDs,
                                    crawlParams,
                                ),
                            )
                        }
                    >
                        Scan Backlog
                    </Button>
                    <Button
                        className="w-32"
                        disabled={!canClickScan}
                        onClick={() =>
                            handleWebScanAction(() =>
                                serverRunFrontpageScan(selectedDomainIDs, {
                                    ...crawlParams,
                                    followLinks: true,
                                    requireRoutines: false,
                                }),
                            )
                        }
                    >
                        Scan Frontpages
                    </Button>
                    <Button
                        className="w-32"
                        disabled={!canClickScan}
                        onClick={() =>
                            handleWebScanAction(() =>
                                serverRunIndexScan(
                                    selectedDomainIDs,
                                    crawlParams,
                                ),
                            )
                        }
                    >
                        Scan Indexes
                    </Button>
                    <Button
                        className="w-32"
                        disabled={!canClickScan}
                        onClick={() => console.log("TODO: rescan errors")}
                    >
                        Rescan Errors
                    </Button>
                </div>
            </div>
        </div>
    );
}

function splitAndSanitizeLinkString(
    links: string,
    delim = ",",
): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const splitLinks = links.split(delim);

    for (const link of splitLinks) {
        if (URL.canParse(link)) {
            valid.push(link);
        } else {
            invalid.push(link);
        }
    }

    return { valid, invalid };
}
