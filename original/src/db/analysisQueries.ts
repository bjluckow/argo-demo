import ScanDatabaseSync from "./ScanDatabaseSync";
import { count, eq, inArray, isNull, not, notInArray, or } from "drizzle-orm";
import { linkpaths, pagescrapes } from "./schema";
import { ReservedPathLabel } from "@/engine/sites/paths";

export interface ScanDatabaseInfo {
    totalPageScrapes: number;
    totalSitemapScrapes: number;
    totalBacklogLinks: number;
}

export async function getScanDatabaseInfo(
    scanDB: ScanDatabaseSync,
): Promise<ScanDatabaseInfo> {
    const totalPageScrapes =
        scanDB.orm
            .select({ count: count() })
            .from(pagescrapes)
            .leftJoin(linkpaths, eq(pagescrapes.linkID, linkpaths.linkID))
            .where(
                or(
                    isNull(linkpaths.pathlabel),
                    notInArray(
                        linkpaths.pathlabel,
                        Object.values(ReservedPathLabel),
                    ),
                ),
            )
            .get()?.count ?? 0;

    const totalSitemapScrapes =
        scanDB.orm
            .select({ count: count() })
            .from(pagescrapes)
            .leftJoin(linkpaths, eq(pagescrapes.linkID, linkpaths.linkID))
            .where(
                inArray(linkpaths.pathlabel, Object.values(ReservedPathLabel)),
            )
            .get()?.count ?? 0;

    const totalBacklogLinks =
        scanDB.orm
            .select({ count: count() })
            .from(linkpaths)
            .leftJoin(pagescrapes, eq(pagescrapes.linkID, linkpaths.linkID))
            .where(isNull(pagescrapes.scrapeID))
            .get()?.count ?? 0;

    return {
        totalPageScrapes,
        totalSitemapScrapes,
        totalBacklogLinks,
    };
}
