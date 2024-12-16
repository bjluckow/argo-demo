import { WebCrawlResult } from "@/engine/WebCrawlEngine";
import SiteCrawlResultView from "./SiteCrawlResultView";

type WebCrawlResultViewProps = { webCrawlResult: WebCrawlResult };

export default function WebCrawlResultView({
    webCrawlResult,
}: WebCrawlResultViewProps) {
    if (!webCrawlResult) {
        return <div>Error</div>;
    }

    const { siteResults, startTime, endTime } = webCrawlResult;
    return (
        <div>
            <h1 className="mt-3 text-lg font-bold">
                Crawled {siteResults.length} sites in{" "}
                {(endTime - startTime) / 1000}s
            </h1>

            {siteResults.map((siteResult, idx) => (
                <SiteCrawlResultView siteResult={siteResult} key={idx} />
            ))}
        </div>
    );
}
