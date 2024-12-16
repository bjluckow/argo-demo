import { SCAN_DB_LOGGER } from "./utils/dbLogger";

import Database from "better-sqlite3"; // https://www.npmjs.com/package/better-sqlite3?activeTab=readme
import { drizzle } from "drizzle-orm/better-sqlite3"; // https://orm.drizzle.team/docs/get-started-sqlite#better-sqlite3
import { eq, sql } from "drizzle-orm";
import {
    domains,
    linkpaths,
    webscans,
    sitecrawls,
    pagescrapes,
    pageerrors,
} from "./schema";
import { DefaultLogger, LogWriter } from "drizzle-orm/logger";

const log = SCAN_DB_LOGGER.getSubLogger({ name: "ScanDB" });

const DB_FILEPATH = process.env.DB_PATH
const SQLITE_DB = new Database(DB_FILEPATH, {
    // verbose: log.debug,
});

// class DatabaseLogWriter implements LogWriter {
//     write(message: string) {
//         // log.debug(message);
//     }
// }
// const logger = new DefaultLogger({ writer: new DatabaseLogWriter() });

const ORM = drizzle({
    client: SQLITE_DB,
    schema: { domains, linkpaths, webscans, sitecrawls, pagescrapes },

});

export type ScanDatabaseORM = typeof ORM;

export type ScanDatabaseTransaction = Parameters<
    Parameters<typeof ORM.transaction>[0]
>[0];

export default class ScanDatabaseSync {
    private static _instance?: ScanDatabaseSync;
    private _orm: ScanDatabaseORM;

    private constructor() {
        this._orm = ORM;
    }

    static getInstance(): ScanDatabaseSync {
        if (!ScanDatabaseSync._instance) {
            ScanDatabaseSync._instance = new ScanDatabaseSync();
        }
        return ScanDatabaseSync._instance;
    }

    public get orm(): ScanDatabaseORM {
        return this._orm;
    }

    // DOMAINS

    createDomain(
        domain: typeof domains.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): typeof domains.$inferSelect {
        const conn = tx ?? this.orm;

        return conn
            .insert(domains)
            .values({
                domainName: domain.domainName,
                homeLink: domain.homeLink,
            })
            .onConflictDoNothing()
            .returning()
            .get();
    }

    readDomain(
        domainID: number,
        tx?: ScanDatabaseTransaction,
    ): typeof domains.$inferSelect | undefined {
        const conn = tx ?? this.orm;

        return conn
            .select()
            .from(domains)
            .where(eq(domains.domainID, domainID))
            .get();
    }

    readAllDomains(): (typeof domains.$inferSelect)[] {
        return this.orm.select().from(domains).all();
    }

    updateDomain(
        domainID: number,
        domain: Partial<typeof domains.$inferInsert>,
        tx?: ScanDatabaseTransaction,
    ): typeof domains.$inferSelect {
        const conn = tx ?? this.orm;

        return conn
            .update(domains)
            .set({ ...domain, domainID })
            .where(eq(domains.domainID, domainID))
            .returning()
            .get();
    }

    // LINKS PATHNAMES

    createLinkPathname(
        linkPathname: typeof linkpaths.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): number {
        const conn = tx ?? this.orm;

        const result = conn
            .insert(linkpaths)
            .values(linkPathname)
            .onConflictDoNothing()
            .returning({ id: linkpaths.linkID })
            .get();

        if (!result) {
            return conn
                .select()
                .from(linkpaths)
                .where(eq(linkpaths.pathname, linkPathname.pathname))
                .get()!.linkID;
        }

        return result.id;
    }

    readLinkPathname(
        linkID: number,
        tx?: ScanDatabaseTransaction,
    ): typeof linkpaths.$inferSelect | undefined {
        const conn = tx ?? this.orm;
        return conn
            .select()
            .from(linkpaths)
            .where(eq(linkpaths.linkID, linkID))
            .get();
    }

    updateLinkPathname(
        linkID: number,
        linkPathname: Partial<typeof linkpaths.$inferInsert>,
        tx?: ScanDatabaseTransaction,
    ): typeof linkpaths.$inferSelect {
        const conn = tx ?? this.orm;
        return conn
            .update(linkpaths)
            .set({ ...linkPathname, linkID })
            .where(eq(linkpaths.linkID, linkID))
            .returning()
            .get();
    }

    // SCANS

    createWebScan(
        webScan: typeof webscans.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): typeof webscans.$inferSelect {
        const conn = tx ?? this.orm;

        return conn.insert(webscans).values(webScan).returning().get();
    }

    readWebScan(
        scanID: number,
        tx?: ScanDatabaseTransaction,
    ): typeof webscans.$inferSelect | undefined {
        const conn = tx ?? this.orm;

        return conn
            .select()
            .from(webscans)
            .where(eq(webscans.scanID, scanID))
            .get();
    }

    updateWebScan(
        scanID: number,
        webScan: Partial<typeof webscans.$inferInsert>,
        tx?: ScanDatabaseTransaction,
    ): typeof webscans.$inferSelect {
        const conn = tx ?? this.orm;
        return conn
            .update(webscans)
            .set({ ...webScan, scanID })
            .where(eq(webscans.scanID, scanID))
            .returning()
            .get();
    }

    // SITE CRAWLS

    createSiteCrawl(
        siteCrawl: typeof sitecrawls.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): typeof sitecrawls.$inferSelect {
        const conn = tx ?? this.orm;
        return conn.insert(sitecrawls).values(siteCrawl).returning().get();
    }

    readSiteCrawl(
        crawlID: number,
        tx?: ScanDatabaseTransaction,
    ): typeof sitecrawls.$inferSelect | undefined {
        const conn = tx ?? this.orm;
        return conn
            .select()
            .from(sitecrawls)
            .where(eq(sitecrawls.crawlID, crawlID))
            .get();
    }

    updateSiteCrawl(
        crawlID: number,
        siteCrawl: typeof sitecrawls.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): typeof sitecrawls.$inferSelect {
        const conn = tx ?? this.orm;
        return conn
            .update(sitecrawls)
            .set({ ...siteCrawl, crawlID })
            .where(eq(sitecrawls.crawlID, crawlID))
            .returning()
            .get();
    }

    // PAGE SCRAPES

    createPageScrape(
        pageScrape: typeof pagescrapes.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): typeof pagescrapes.$inferSelect {
        const conn = tx ?? this.orm;
        return conn.insert(pagescrapes).values(pageScrape).returning().get();
    }

    readPageScrape(
        scrapeID: number,
        tx?: ScanDatabaseTransaction,
    ): typeof pagescrapes.$inferSelect | undefined {
        const conn = tx ?? this.orm;
        return conn
            .select()
            .from(pagescrapes)
            .where(eq(pagescrapes.scrapeID, scrapeID))
            .get();
    }

    updatePageScrape(
        scrapeID: number,
        pageScrape: Partial<typeof pagescrapes.$inferInsert>,
        tx?: ScanDatabaseTransaction,
    ): typeof pagescrapes.$inferSelect {
        const conn = tx ?? this.orm;
        return conn
            .update(pagescrapes)
            .set({ ...pageScrape, scrapeID })
            .where(eq(pagescrapes.scrapeID, scrapeID))
            .returning()
            .get();
    }

    // PAGE ERRORS

    createPageError(
        pageError: typeof pageerrors.$inferInsert,
        tx?: ScanDatabaseTransaction,
    ): typeof pageerrors.$inferSelect {
        const conn = tx ?? this.orm;
        return conn.insert(pageerrors).values(pageError).returning().get();
    }

    readPageError(
        errorID: number,
        tx?: ScanDatabaseTransaction,
    ): typeof pageerrors.$inferSelect | undefined {
        const conn = tx ?? this.orm;
        return conn
            .select()
            .from(pageerrors)
            .where(eq(pageerrors.errorID, errorID))
            .get();
    }

    updatePageError(
        errorID: number,
        pageError: Partial<typeof pageerrors.$inferInsert>,
        tx?: ScanDatabaseTransaction,
    ): typeof pageerrors.$inferSelect {
        const conn = tx ?? this.orm;
        return conn
            .update(pageerrors)
            .set({ ...pageError, errorID })
            .where(eq(pageerrors.errorID, errorID))
            .returning()
            .get();
    }
}
