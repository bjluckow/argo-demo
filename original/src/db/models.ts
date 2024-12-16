import { SiteConfig } from "@/engine/sites";
import {
    domains,
    linkpaths,
    webscans,
    sitecrawls,
    pagescrapes,
    pageerrors,
} from "./schema";

export type SiteConfigModel = {
    _id: number;
} & SiteConfig;

export type DomainModel = typeof domains.$inferSelect;
export type DomainModelPartial = typeof domains.$inferInsert;

export enum DomainRegion {
    US_STATE_NY = "us-state-ny",
    US_STATE_AL = "us-state-al",
    US_STATE_CA = "us-state-ca",
}

interface IDomainModel {
    domainID?: number;

    domainName: string;
    homeLink: string;
    region?: DomainRegion;
    notes: string;
}

export type LinkPathnameModel = typeof linkpaths.$inferSelect;
export type LinkPathnameModelPartial = typeof linkpaths.$inferInsert;

interface ILinkPathnameModel {
    linkID?: number;
    domainID: number;
    pathname: string;
}

export type WebScanModel = typeof webscans.$inferSelect;
export type WebScanModelPartial = typeof webscans.$inferInsert;

interface IWebScanModel {
    scanID?: number;
    startTime: number;
    endTime: number;
}

export type SiteCrawlModel = typeof sitecrawls.$inferSelect;
export type SiteCrawlModelPartial = typeof sitecrawls.$inferInsert;

interface ISiteCrawlModel {
    crawlID?: number;
    domainID: number;
    scanID: number;
}

export type PageScrapeModel = typeof pagescrapes.$inferSelect;
export type PageScrapeModelPartial = typeof pagescrapes.$inferInsert;

interface IPageScrapeModel {
    scrapeID?: number;
    linkID: number;
    crawlID: number;

    numLinks: number;
    error?: string;

    // Data
    textbody?: string;
    title?: string;
    author?: string;
    datepub?: string;
    tags?: string;
    descriptions?: string;
    comments?: string;
    media?: string;
    captions?: string;
}

export type PageErrorModel = typeof pageerrors.$inferSelect;
export type PageErrorModelPartial = typeof pageerrors.$inferInsert;
