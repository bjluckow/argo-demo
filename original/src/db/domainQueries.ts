import ScanDatabaseSync from "./ScanDatabaseSync";
import {
    count,
    and,
    eq,
    isNotNull,
    isNull,
    asc,
    desc,
    gte,
    not,
    inArray,
    or,
    notInArray,
    notExists,
} from "drizzle-orm";
import {
    domains,
    pagescrapes,
    linkpaths,
    sitecrawls,
    pageerrors,
} from "./schema";
import { LinkPathnameModel, PageErrorModel, PageScrapeModel } from "./models";
import { ReservedPathLabel } from "@/engine/sites/paths";

export interface DomainInfo {
    numScrapes: number;
    numVisitedLinks: number;
    numUnvisitedLinks: number;
    numFailedLinks: number;
    numVisitedSitemapLinks: number;
    numUnvisitedSitemapLinks: number;
    numFailedSitemapLinks: number;
    lastError?: DomainErrorInfo;
    recentErrors?: DomainErrorInfo[];
}

export interface DomainErrorInfo {
    pageerrors: PageErrorModel;
    linkpaths: LinkPathnameModel;
}

export function getDomainInfo(
    domainID: number,
    scanDB: ScanDatabaseSync,
): DomainInfo {
    return scanDB.orm.transaction((tx) => {
        const totalNumLinks =
            tx
                .select({ count: count() })
                .from(linkpaths)
                .where(eq(linkpaths.domainID, domainID))
                .get()?.count ?? 0;

        const numScrapes =
            tx
                .select({ count: count() })
                .from(pagescrapes)
                .leftJoin(linkpaths, eq(linkpaths.linkID, pagescrapes.linkID))
                .where(eq(linkpaths.domainID, domainID))
                .get()?.count ?? 0;

        const numVisitedLinks =
            tx
                .select({ count: count() })
                .from(linkpaths)
                .innerJoin(
                    pagescrapes,
                    eq(linkpaths.linkID, pagescrapes.linkID),
                )
                .where(eq(linkpaths.domainID, domainID))
                .get()?.count ?? 0;

        const numUnvisitedLinks =
            tx
                .select({ count: count() })
                .from(linkpaths)
                .leftJoin(pagescrapes, eq(linkpaths.linkID, pagescrapes.linkID))
                .where(
                    and(
                        notExists(
                            tx
                                .select()
                                .from(pagescrapes)
                                .where(
                                    eq(pagescrapes.linkID, linkpaths.linkID),
                                ),
                        ),
                        eq(linkpaths.domainID, domainID),
                    ),
                )
                .get()?.count ?? 0;

        const numFailedLinks =
            tx
                .select({ count: count() })
                .from(pageerrors)
                .leftJoin(linkpaths, eq(linkpaths.linkID, pageerrors.linkID))
                .where(eq(linkpaths.domainID, domainID))
                .get()?.count ?? 0;

        const numVisitedSitemapLinks =
            tx
                .select({ count: count() })
                .from(linkpaths)
                .innerJoin(
                    pagescrapes,
                    eq(linkpaths.linkID, pagescrapes.linkID),
                )
                .where(
                    and(
                        eq(linkpaths.domainID, domainID),
                        inArray(
                            linkpaths.pathlabel,
                            Object.values(ReservedPathLabel),
                        ),
                    ),
                )
                .get()?.count ?? 0;

        const numUnvisitedSitemapLinks =
            tx
                .select({ count: count() })
                .from(linkpaths)
                .leftJoin(pagescrapes, eq(linkpaths.linkID, pagescrapes.linkID))
                .where(
                    and(
                        eq(linkpaths.domainID, domainID),
                        isNull(pagescrapes.scrapeID),
                        inArray(
                            linkpaths.pathlabel,
                            Object.values(ReservedPathLabel),
                        ),
                    ),
                )
                .get()?.count ?? 0;

        const numFailedSitemapLinks =
            tx
                .select({ count: count() })
                .from(pageerrors)
                .leftJoin(linkpaths, eq(linkpaths.linkID, pageerrors.linkID))
                .where(
                    and(
                        eq(linkpaths.domainID, domainID),
                        inArray(
                            linkpaths.pathlabel,
                            Object.values(ReservedPathLabel),
                        ),
                    ),
                )
                .get()?.count ?? 0;

        const lastError = tx
            .select()
            .from(pageerrors)
            .innerJoin(linkpaths, eq(pageerrors.linkID, linkpaths.linkID))
            .where(eq(linkpaths.domainID, domainID))
            .orderBy(desc(pageerrors.time))
            .limit(1)
            .get();

        const recentErrors = tx
            .select()
            .from(pageerrors)
            .innerJoin(linkpaths, eq(pageerrors.linkID, linkpaths.linkID))
            .where(
                and(
                    eq(linkpaths.domainID, domainID),
                    gte(pageerrors.time, Date.now() - 24 * 60 * 60 * 1000), // Past 24 hours
                ),
            )
            .orderBy(desc(pageerrors.time))
            .all();

        return {
            numScrapes,
            numVisitedLinks,
            numUnvisitedLinks,
            numFailedLinks,
            numVisitedSitemapLinks,
            numUnvisitedSitemapLinks,
            numFailedSitemapLinks,
            lastError,
            recentErrors,
        };
    });
}

export async function getDisabledDomainIDs(
    webDB: ScanDatabaseSync,
): Promise<number[]> {
    const result = await webDB.orm
        .selectDistinct({ domainID: domains.domainID })
        .from(domains)
        .leftJoin(sitecrawls, eq(domains.domainID, sitecrawls.domainID))
        .leftJoin(pageerrors, eq(sitecrawls.crawlID, pageerrors.crawlID))
        .where(gte(pageerrors.time, Date.now() - 24 * 60 * 60 * 1000));

    return result.map(({ domainID }) => domainID);
}
