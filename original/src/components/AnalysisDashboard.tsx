import { useState, useEffect } from "react";
import { serverGetWebDatabaseInfo } from "@/app/_api/scanAPI";
import { Card, Icon } from "@blueprintjs/core";
import { ScanDatabaseInfo } from "@/db/analysisQueries";

export default function AnalysisDashboard() {
    const [dbInfo, setDbInfo] = useState<ScanDatabaseInfo>();

    useEffect(() => {
        const fetchScrapeCount = async () => {
            const info = await serverGetWebDatabaseInfo();
            setDbInfo(info);
        };
        fetchScrapeCount();
    }, []);

    if (!dbInfo) {
        return <div>Loading database info...</div>;
    }

    return (
        <Card className="m-5 min-h-[30vh] w-full rounded-xl border-2 caret-transparent shadow-sm">
            <h1 className="text-lg font-bold">Analysis Dashboard</h1>
            <br />
            <p>{dbInfo.totalPageScrapes} page scrapes stored</p>
            <p>
                {dbInfo.totalSitemapScrapes} robots.txt and sitemap scrapes
                stored
            </p>
            <p>{dbInfo.totalBacklogLinks} unvisited links</p>
        </Card>
    );
}
