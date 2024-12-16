import ScrapingCoreError from "../scraping/utils/ScrapingCoreError";
import {
    FetchError,
    FetchErrorType,
    FetchParams,
    FetchResponse,
    fetchURL,
} from "./fetch";
import { parseStringPromise } from "xml2js";

export type SitemapFetchResult = FetchResponse & ParsedSitemapData;

export async function fetchSitemap(
    sitemapURL: URL,
    fetchParams: FetchParams,
): Promise<SitemapFetchResult> {
    const fetchResult = await fetchURL(sitemapURL, fetchParams);
    try {
        const parsedData = await parseSitemap(fetchResult.content, sitemapURL);
        return {
            ...fetchResult,
            ...parsedData,
        };
    } catch (error) {
        throw new FetchError(FetchErrorType.Parsing, {
            url: sitemapURL,
            params: fetchParams,
        });
    }
}

type ParsedSitemapData = {
    pageLinks?: SitemapLinkData[];
    nestedSitemapLinks?: SitemapLinkData[];
};

type SitemapLinkData = { link: string; lastModified?: string };

// FORMAT INTERFACES

interface SitemapIndex {
    sitemapindex: {
        sitemap: SitemapEntry[] | SitemapEntry;
    };
}

interface SitemapEntry {
    loc: string;
    lastmod?: string;
}

interface UrlSet {
    urlset: {
        url: UrlEntry[] | UrlEntry;
    };
}

interface UrlEntry {
    loc: string;
    lastmod?: string; // ISO 8601 date string or another date format
}

async function parseSitemap(
    xmlData: string,
    url: URL,
): Promise<ParsedSitemapData> {
    try {
        const result = await parseStringPromise(xmlData, {
            explicitArray: false,
            mergeAttrs: true,
            normalizeTags: true,
        });

        if ("sitemapindex" in result) {
            const sitemapIndex: SitemapIndex =
                result as unknown as SitemapIndex;

            return {
                nestedSitemapLinks: parseSitemapIndex(
                    sitemapIndex.sitemapindex,
                ),
            };
        } else if ("urlset" in result) {
            const urlSet: UrlSet = result as unknown as UrlSet;
            return { pageLinks: parseUrlSet(urlSet.urlset) };
        } else {
            throw new Error(
                "Unexpected XML structure. The XML does not conform to sitemap standards.",
            );
        }
    } catch (error) {
        throw new SitemapParsingError(
            undefined, // Let inferErrorType determine the error type based on caughtError
            { url, xmlContent: xmlData },
            error as Error,
        );
    }
}

function parseSitemapIndex(
    sitemapIndex: SitemapIndex["sitemapindex"],
): SitemapLinkData[] {
    const sitemaps = Array.isArray(sitemapIndex.sitemap)
        ? sitemapIndex.sitemap
        : [sitemapIndex.sitemap];

    const indexedSitemapUrls: SitemapLinkData[] = sitemaps
        .map((sitemap) => ({
            link: sitemap.loc,
            lastModified: sitemap.lastmod,
        }))
        .filter((sitemap) => Boolean(sitemap.link));

    return indexedSitemapUrls;
}

function parseUrlSet(urlSet: UrlSet["urlset"]): SitemapLinkData[] {
    const urlEntries = Array.isArray(urlSet.url) ? urlSet.url : [urlSet.url];

    const linkData: SitemapLinkData[] = urlEntries
        .map((entry) => ({
            link: entry.loc,
            lastModified: entry.lastmod,
        }))
        .filter((entry) => Boolean(entry.link));

    return linkData;
}

// ERRORS

export enum SitemapParsingErrorType {
    InvalidFormat = "The sitemap does not conform to expected XML format.",
    EmptySitemap = "The sitemap is empty or lacks required elements.",
    Unknown = "An unknown error occurred during sitemap parsing.",
}

type SitemapErrorContext = {
    url: URL;
    xmlContent?: string;
};

export class SitemapParsingError extends ScrapingCoreError<
    SitemapParsingErrorType,
    SitemapErrorContext
> {
    constructor(
        errorType: SitemapParsingErrorType | undefined,
        public context: SitemapErrorContext,
        public caughtError?: Error,
    ) {
        super(
            SitemapParsingError.inferErrorType(errorType, caughtError),
            context,
            caughtError,
        );
        this.name = this.constructor.name;
    }

    private static inferErrorType(
        errorType?: SitemapParsingErrorType,
        caughtError?: Error,
    ): SitemapParsingErrorType {
        if (errorType) {
            return errorType;
        }

        if (!caughtError) {
            return SitemapParsingErrorType.Unknown;
        } else if (caughtError instanceof SyntaxError) {
            return SitemapParsingErrorType.InvalidFormat;
        } else {
            return SitemapParsingErrorType.Unknown;
        }
    }
}
