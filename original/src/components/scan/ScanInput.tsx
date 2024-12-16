import { Dispatch, SetStateAction } from "react";
import { CrawlParams } from "@/engine/crawl";
import { InputGroup, NumericInput } from "@blueprintjs/core";

type ScanInputProps = {
    crawlParams: CrawlParams;
    setCrawlParams: Dispatch<SetStateAction<CrawlParams>>;
    disable: boolean;
};

export default function ScanInput({
    crawlParams,
    setCrawlParams,
    disable,
}: ScanInputProps) {
    return (
        <div>
            <h1 className="text-center font-semibold">Scan Parameters</h1>
            <div className="flex max-w-fit flex-col items-center gap-y-2 py-5"></div>
        </div>
    );
}
