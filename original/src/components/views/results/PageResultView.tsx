import { useState } from "react";
import ScrapedDataView from "./ScrapedDataView";
import { SiteCrawlResult } from "@/engine/SiteCrawler";
import { SiteScrapeResult } from "@/engine/SiteScraper";
import { Card, Button, Collapse } from "@blueprintjs/core";

type PageResultViewProps = {
    index: number;
    pageResult: SiteScrapeResult;
    errors?: SiteCrawlResult["errors"][0];
};

export default function PageResultView({
    index,
    pageResult,
}: PageResultViewProps) {
    const [showStats, setShowStats] = useState<boolean>(false);
    const [showScrapedData, setShowScrapedData] = useState<boolean>(false);
    const { pageLink, pageTitle, pathLabel, scrapedData } = pageResult;

    // const intervalSecs = pageResult.interval / 1000;
    const scrapingTimeSecs = (pageResult.endTime - pageResult.startTime) / 1000;

    return (
        <Card interactive={true}>
            <h3 className="mb-1 font-light">
                Page {index}: {pathLabel}
            </h3>
            <h1 className="mb-1 font-medium">{pageLink}</h1>
            <h2 className="font-medium">{pageTitle}</h2>

            <br />

            <Button
                text={showStats ? "Hide Visit Info" : "Show Visit Info"}
                onClick={() => setShowStats((v) => !v)}
                small={true}
            />

            <br />
            <br />

            <Collapse isOpen={showStats}>
                <li>Method: {pageResult.reqMethod}</li>
                {/* <li>Interval: {intervalSecs}s</li> */}
                <li>Scraping Time: {scrapingTimeSecs}s</li>
                <br />
            </Collapse>

            {scrapedData && scrapedData.values.length > 0 && (
                <div>
                    <Button
                        text={
                            showScrapedData
                                ? "Hide Scraped Data Elements"
                                : `Show ${scrapedData.values.length} Scraped Data Elements`
                        }
                        onClick={() => setShowScrapedData((v) => !v)}
                        disabled={scrapedData.values.length === 0}
                    />

                    <br />
                    <br />

                    <Collapse isOpen={showScrapedData}>
                        <ScrapedDataView scrapedData={scrapedData} />
                    </Collapse>
                </div>
            )}
        </Card>
    );
}
