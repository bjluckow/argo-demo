import { sqliteTable, integer, text, unique } from "drizzle-orm/sqlite-core";

// SCHEMA

export const domains = sqliteTable("domains", {
    domainID: integer("domainID").primaryKey({ autoIncrement: true }),
    domainName: text("domain_name").notNull(),
    homeLink: text("home_link").notNull().unique(),
    region: text("region"),
    notes: text("notes").default(""),
});

export const linkpaths = sqliteTable(
    "linkpaths",
    {
        linkID: integer("linkID").primaryKey({ autoIncrement: true }),
        domainID: integer("domainID")
            .notNull()
            .references(() => domains.domainID, { onDelete: "cascade" }),
        pathname: text("pathname").notNull(),
        pathlabel: text("pathlabel"),
        freq: integer("freq").notNull().default(0),
    },
    (t) => ({
        unq: unique().on(t.domainID, t.pathname),
    }),
);

export const webscans = sqliteTable("webscans", {
    scanID: integer("scanID").primaryKey({ autoIncrement: true }),
    scanType: text("scan_type").notNull(),
    startTime: integer("start_time").notNull(),
    endTime: integer("end_time"),
    error: text("error"),
});

export const sitecrawls = sqliteTable("sitecrawls", {
    crawlID: integer("crawlID").primaryKey({ autoIncrement: true }),
    domainID: integer("domainID")
        .notNull()
        .references(() => domains.domainID, { onDelete: "cascade" }),
    scanID: integer("scanID")
        .notNull()
        .references(() => webscans.scanID),
    startTime: integer("start_time"), // TODO: not null
    endTime: integer("end_time"),
    // TODO: start time and end time
});

export const pagescrapes = sqliteTable("pagescrapes", {
    scrapeID: integer("scrapeID").primaryKey({ autoIncrement: true }),
    linkID: integer("linkID")
        .notNull()
        .references(() => linkpaths.linkID, { onDelete: "cascade" }),
    crawlID: integer("crawlID").references(() => sitecrawls.crawlID, {
        onDelete: "set null",
    }),
    startTime: integer("start_time").notNull(),
    endTime: integer("end_time").notNull(),
    numLinks: integer("num_links").default(0), // Not necessarily how many linkpaths
    pathLabel: text("path_label"),
    // scraped data
    textbody: text("textbody"),
    title: text("title"),
    author: text("author"),
    datepub: text("datepub"),
    tags: text("tags"),
    descriptions: text("descriptions"),
    comments: text("comments"),
    media: text("media"),
    captions: text("captions"),
    engagement: integer("engagement"),
});

// export const pagedata = sqliteTable("pagescrapes", {
//     dataID: integer("dataID").primaryKey({ autoIncrement: true }),
//     scrapeID: integer("scrapeID")
//         .notNull()
//         .references(() => linkpaths.linkID, { onDelete: "cascade" }),
//     textbody: text("textbody"),
//     title: text("title"),
//     author: text("author"),
//     datepub: text("datepub"),
//     tags: text("tags"),
//     descriptions: text("descriptions"),
//     comments: text("comments"),
//     media: text("media"),
//     captions: text("captions"),
// });

export const pageerrors = sqliteTable("pageerrors", {
    errorID: integer("errorID").primaryKey({ autoIncrement: true }),
    linkID: integer("linkID")
        .notNull()
        .references(() => linkpaths.linkID),
    crawlID: integer("crawlID")
        .notNull()
        .references(() => sitecrawls.crawlID),
    time: integer("time").notNull(),
    blob: text("blob").notNull(),
    resolution: text("resolution"),
});
