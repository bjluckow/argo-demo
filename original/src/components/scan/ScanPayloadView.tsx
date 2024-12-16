import { useState } from "react";
import { ScanPayload } from "@/services/scan/engine";
import SiteCrawlResultView from "../views/results/SiteCrawlResultView";
import WebCrawlResultView from "../views/results/WebCrawlResultView";
import { Button } from "@blueprintjs/core";

export type ScanPayloadViewProps = { payload: ScanPayload };

export default function ScanPayloadView({ payload }: ScanPayloadViewProps) {
    if (!payload.success) {
        return (
            <div>
                Service error (Running Time:{" "}
                {payload.endTime - payload.startTime}ms): {payload.errorJSON}
            </div>
        );
    }
    const { scanID, startTime, endTime, stats } = payload;
    const runningTime = endTime - startTime;

    // const jsonString = JSON.stringify(payload, null, 2);
    // const bytes = new TextEncoder().encode(jsonString).length; // Get the length in bytes
    // const megabytes = (bytes / 2 ** 20).toFixed(2);
    // const fileSize = `${megabytes} MB`;

    // const handleDownloadJson = () => {
    //     const fileBlob = new Blob([jsonString], { type: "application/json" });
    //     const fileUrl = URL.createObjectURL(fileBlob);
    //     const link = document.createElement("a");
    //     link.href = fileUrl;
    //     link.download = "webScanResults.json";
    //     document.body.appendChild(link);
    //     link.click();

    //     URL.revokeObjectURL(fileUrl);
    //     link.remove();
    // };

    return (
        <div>
            <h1 className="text-xl font-bold">
                Scan Completed in {runningTime / 1000} seconds
            </h1>
            <br />
            {/* <Button
                icon="download"
                text={`Download Data JSON (${fileSize})`}
                onClick={handleDownloadJson}
                small={true}
                disabled={!payload}
            /> */}
            <p>{stats.crawlIDs.length} site crawls stored</p>
            <p>{stats.scrapeIDs.length} page scrapes stored</p>
            <p>{stats.linkIDs.length} links stored</p>
            <p>{stats.errorIDs.length} errors stored</p>
        </div>
    );
}
