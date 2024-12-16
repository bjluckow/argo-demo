"use server";
import ScanService from "@/services/scan/ScanService";
import { ScanPayload } from "@/services/scan/engine";
import { CrawlParams } from "@/engine/crawl";
import { DomainModel } from "@/db/models";
import { SiteConfigModel } from "@/db/models";
import { SitePaths, SitePath } from "@/engine/sites/paths";
import { ScanDatabaseInfo } from "@/db/analysisQueries";

// ENGINE TASKS API

export async function serverRunLinkScan(
    domainIDs: number[],
    inputLinks: string[],
    crawlParams: Partial<CrawlParams> = {},
): Promise<ScanPayload> {
    return await ScanService.getInstance().scanWebsites(
        domainIDs,
        "links",
        inputLinks,
        crawlParams,
    );
}

export async function serverRunBacklogScan(
    domainIDs: number[],
    crawlParams: Partial<CrawlParams> = {},
): Promise<ScanPayload> {
    return await ScanService.getInstance().scanWebsites(
        domainIDs,
        "backlogs",
        [],
        crawlParams,
    );
}

export async function serverRunIndexScan(
    domainIDs: number[],
    crawlParams: Partial<CrawlParams> = {},
): Promise<ScanPayload> {
    return await ScanService.getInstance().scanWebsites(
        domainIDs,
        "indexes",
        [],
        crawlParams,
    );
}

export async function serverRunFrontpageScan(
    domainIDs: number[],
    crawlParams: Partial<CrawlParams> = {},
): Promise<ScanPayload> {
    return await ScanService.getInstance().scanWebsites(
        domainIDs,
        "frontpages",
        [],
        crawlParams,
    );
}

// DB C.R.U.D.

export async function serverCreateNewDomainAndConfig(
    domainName: string,
    homepageLink: string,
): Promise<number> {
    // Returns shared ID
    return await ScanService.getInstance().createDomain(
        domainName,
        homepageLink,
    );
}

// DOMAIN DB C.R.U.D.

export async function serverGetDomains(
    domainIDs: number[],
): Promise<DomainModel[]> {
    return await ScanService.getInstance().getDomains(domainIDs);
}

export async function serverGetDomainInfo(domainID: number) {
    return await ScanService.getInstance().getDomainInfo(domainID);
}

export async function serverGetAllDomains(): Promise<{
    domains: DomainModel[];
    disabledIDs: number[];
}> {
    const domains = await ScanService.getInstance().getAllDomains();
    const disabledIDs = await ScanService.getInstance().getDisabledDomainIDs();
    return { domains, disabledIDs };
}

export async function serverDeleteDomain(domainID: number): Promise<void> {
    await ScanService.getInstance().deleteDomain(domainID);
}

export async function serverUpdateDomain(
    domainID: number,
    domain: Partial<DomainModel>,
): Promise<void> {
    ScanService.getInstance().updateDomain(domainID, domain);
}

// SITE CONFIGS C.R.U.D.

export async function serverGetSiteConfigs(
    domainIDs: number[],
): Promise<SiteConfigModel[]> {
    return await ScanService.getInstance().getSiteConfigs(domainIDs);
}

export async function serverUpdateConfig(
    config: Partial<SiteConfigModel>,
    id: number,
) {
    return ScanService.getInstance().updateSiteConfig(config, id);
}

// DATA API

export async function serverGetWebDatabaseInfo(): Promise<ScanDatabaseInfo> {
    return ScanService.getInstance().getDatabaseInfo();
}
