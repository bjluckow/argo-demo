import sqlite3 from "better-sqlite3";
import { DomainModel, PageScrapeModel, SiteCrawlModel } from "./models";
import { Domain } from "domain";

const db = sqlite3("scan.db", { verbose: console.log });

// Create 'domains' table
db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
        domainID INTEGER PRIMARY KEY AUTOINCREMENT,
        domainName TEXT NOT NULL,
        homeLink TEXT NOT NULL UNIQUE,
        region TEXT,
        notes TEXT DEFAULT ''
    );
`);

// Create 'linkpaths' table
db.exec(`
    CREATE TABLE IF NOT EXISTS linkpaths (
        linkID INTEGER PRIMARY KEY AUTOINCREMENT,
        domainID INTEGER NOT NULL,
        pathname TEXT NOT NULL UNIQUE,
        pathlabel TEXT,
        freq INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (domainID) REFERENCES domains(domainID) ON DELETE CASCADE
    );
`);

// Create 'webscans' table
db.exec(`
    CREATE TABLE IF NOT EXISTS webscans (
        scanID INTEGER PRIMARY KEY AUTOINCREMENT,
        scanType TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER,
        error TEXT
    );
`);

// Create 'sitecrawls' table
db.exec(`
    CREATE TABLE IF NOT EXISTS sitecrawls (
        crawlID INTEGER PRIMARY KEY AUTOINCREMENT,
        domainID INTEGER NOT NULL,
        scanID INTEGER NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER,
        FOREIGN KEY (domainID) REFERENCES domains(domainID) ON DELETE CASCADE,
        FOREIGN KEY (scanID) REFERENCES webscans(scanID)
    );
`);

// Create 'pagescrapes' table
db.exec(`
    CREATE TABLE IF NOT EXISTS pagescrapes (
        scrapeID INTEGER PRIMARY KEY AUTOINCREMENT,
        linkID INTEGER NOT NULL,
        crawlID INTEGER,
        startTime INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        numLinks INTEGER DEFAULT 0,
        pathLabel TEXT,
        textbody TEXT,
        title TEXT,
        author TEXT,
        datepub TEXT,
        tags TEXT,
        descriptions TEXT,
        comments TEXT,
        media TEXT,
        captions TEXT,
        engagement INTEGER,
        FOREIGN KEY (linkID) REFERENCES linkpaths(linkID) ON DELETE CASCADE,
        FOREIGN KEY (crawlID) REFERENCES sitecrawls(crawlID) ON DELETE SET NULL
    );
`);

// Create 'pageerrors' table
db.exec(`
    CREATE TABLE IF NOT EXISTS pageerrors (
        errorID INTEGER PRIMARY KEY AUTOINCREMENT,
        linkID INTEGER NOT NULL,
        crawlID INTEGER NOT NULL,
        time INTEGER NOT NULL,
        blob TEXT NOT NULL,
        resolution TEXT,
        FOREIGN KEY (linkID) REFERENCES linkpaths(linkID),
        FOREIGN KEY (crawlID) REFERENCES sitecrawls(crawlID)
    );
`);

console.log("All tables created successfully");

export default class ScanDatabaseAsync {
    async createDomain(domain: DomainModel) {
        const stmt = db.prepare(
            `INSERT INTO domains (domainName, homeLink, region, notes) VALUES (?, ?, ?, ?) ON CONFLICT(homeLink) DO NOTHING RETURNING *`,
        );
        return stmt.run(
            domain.domainName,
            domain.homeLink,
            domain.region || null,
            domain.notes || "",
        ).lastInsertRowid;
    }

    async readDomain(domainID: number) {
        const stmt = db.prepare(`SELECT * FROM domains WHERE domainID = ?`);
        return stmt.get(domainID) as DomainModel;
    }

    async readAllDomains() {
        const stmt = db.prepare(`SELECT * FROM domains`);
        return stmt.all() as DomainModel[];
    }

    async updateDomain(domainID: number, domain: Partial<DomainModel>) {
        const keys = Object.keys(domain);
        const values = Object.values(domain);

        // Building the SQL dynamically based on the input keys
        const sql = `UPDATE domains SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE domainID = ? RETURNING *`;
        const stmt = db.prepare(sql);
        return stmt.run(...values, domainID).lastInsertRowid;
    }

    async createSiteCrawl(siteCrawl: SiteCrawlModel) {
        const stmt = db.prepare(
            `INSERT INTO sitecrawls (domainID, scanID, startTime, endTime) VALUES (?, ?, ?, ?)`,
        );
        const result = stmt.run(
            siteCrawl.domainID,
            siteCrawl.scanID,
            siteCrawl.startTime,
            siteCrawl.endTime,
        );
        return result.lastInsertRowid;
    }

    async readSiteCrawl(crawlID: number): Promise<SiteCrawlModel> {
        const stmt = db.prepare(`SELECT * FROM sitecrawls WHERE crawlID = ?`);
        return stmt.get(crawlID) as SiteCrawlModel;
    }

    async updateSiteCrawl(crawlID: number, siteCrawl: Partial<SiteCrawlModel>) {
        const keys = Object.keys(siteCrawl).filter(
            (key) => key !== "crawlID",
        ) as (keyof SiteCrawlModel)[];
        const values = keys.map((key) => siteCrawl[key]);
        const sql = `UPDATE sitecrawls SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE crawlID = ?`;
        const stmt = db.prepare(sql);

        return this.readSiteCrawl(crawlID); // Fetch the updated entry
    }

    async createPageScrape(pageScrape: PageScrapeModel) {
        const stmt = db.prepare(
            `INSERT INTO pagescrapes (linkID, crawlID, startTime, endTime, textbody, title, author, datepub, tags, descriptions, comments, media, captions, engagement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        const result = stmt.run(
            pageScrape.linkID,
            pageScrape.crawlID,
            pageScrape.startTime,
            pageScrape.endTime,
            pageScrape.textbody,
            pageScrape.title,
            pageScrape.author,
            pageScrape.datepub,
            pageScrape.tags,
            pageScrape.descriptions,
            pageScrape.comments,
            pageScrape.media,
            pageScrape.captions,
            pageScrape.engagement,
        );
        return result.lastInsertRowid; // Fetch the newly created entry
    }
}
