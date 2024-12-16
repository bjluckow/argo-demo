import { useState } from "react";
import { SiteCrawlResult } from "@/engine/SiteCrawler";
import SiteScraper, { SiteScrapeResult } from "@/engine/SiteScraper";
import PageResultView from "./PageResultView";
import ResultsList from "./ResultsList";
import SiteErrorLog from "./SiteErrorLog";
import { Card, Intent, SectionCard, Button, Collapse } from "@blueprintjs/core";

type SiteCrawlResultViewProps = {
    siteResult: SiteCrawlResult;
};

const DEFAULT_RESULT_SIZE = 5;
const LOAD_RESULT_STEP_SIZE = 10;

export default function SiteCrawlResultView({
    siteResult,
}: SiteCrawlResultViewProps) {
    const [showSitemapCrawl, setShowSitemapCrawl] = useState<boolean>(false);

    const {
        completed,
        siteHostname,
        siteMetadata,
        pageResults,
        startTime,
        endTime,

        unvisitedLinks,
        // visitedLinks,
        // failedLinks,
        // skippedLinks,
        errors,
    } = siteResult;

    const statusMsg = completed ? "Completed" : "Terminated Early";

    const totalCrawlTimeSecs = (endTime - startTime) / 1000;

    // const totalIntervalSecs =
    //     pageResults
    //         .map((pageResult) => pageResult.interval)
    //         .reduce((total, t) => total + t, 0) / 1000;
    // const avgIntervalSecs = totalIntervalSecs / pageResults.length;

    const totalScrapeSecs =
        pageResults
            .map((pageResult) => pageResult.endTime - pageResult.startTime)
            .reduce((total, t) => total + t, 0) / 1000;
    const avgScrapeSecs = totalScrapeSecs / pageResults.length;

    // const totalIdleTimeSecs = totalIntervalSecs - totalScrapeSecs;
    // const avgIdleTimeSecs = totalIdleTimeSecs / pageResults.length;

    return (
        <SectionCard>
            <h1 className="text-lg font-semibold">
                {siteHostname} [{statusMsg}]
            </h1>
            <h1 className="font-semibold">
                {pageResults.length} results in {totalCrawlTimeSecs}s
            </h1>
            <br />
            {/* <div>
                <p>
                    {visitedLinks.length} visited, {unvisitedLinks.length}{" "}
                    unvisited, {skippedLinks.length} skipped.
                </p>

                <SiteErrorLog failedLinks={failedLinks} errors={errors} />

                <br />

                <p>
                    Total Interval time: {totalIntervalSecs}s (Avg{" "}
                    {avgIntervalSecs.toFixed(3)}s)
                </p>
                <p>
                    Total Scraping time: {totalScrapeSecs}s (Avg{" "}
                    {avgScrapeSecs.toFixed(3)}
                    s)
                </p>
                <p>
                    Total Idle time: {totalIdleTimeSecs.toFixed(3)}s (Avg{" "}
                    {avgIdleTimeSecs.toFixed(3)}
                    s)
                </p>
            </div>
            <br /> */}

            <ResultsList<SiteScrapeResult>
                name="Page Results"
                collapsible={true}
                results={pageResults}
                defaultNum={10}
                showMoreStepSize={5}
                renderData={(result, index) => (
                    <PageResultView
                        pageResult={result}
                        index={index + 1}
                        key={index}
                    />
                )}
            />
        </SectionCard>
    );
}
