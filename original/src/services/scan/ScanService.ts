import { SCAN_LOGGER } from "./utils/scanLogger";
import { buildDefaultSiteConfig } from "@/engine/sites";
import SiteConfigDatabase, {
    SiteConfigDatabaseError,
} from "../../db/SiteConfigDatabase";
import { SiteConfigModel } from "../../db/models";
import ScanDatabaseSync from "@/db/ScanDatabaseSync";
import { DomainRegion, DomainModel } from "../../db/models";
import ScanEngine, { ScanPayload } from "./engine";
import { CrawlParams } from "@/engine/crawl";
import {
    getDomainInfo,
    DomainInfo,
    getDisabledDomainIDs,
} from "../../db/domainQueries";
import { ScanTask } from "./engine";
import { ScanDatabaseInfo, getScanDatabaseInfo } from "../../db/analysisQueries";

/**
 *
 * Seed, Front page, Backlog, Index
 *
 */

const log = SCAN_LOGGER;

// IMPORTANT: The client cannot receive URL objects

export default class ScanService {
    private static instance: ScanService;
    private scanDB: ScanDatabaseSync;
    private configDB: SiteConfigDatabase;

    private scanEngine: ScanEngine;

    private constructor() {
        this.configDB = SiteConfigDatabase.getInstance();
        this.scanDB = ScanDatabaseSync.getInstance();
        this.scanEngine = new ScanEngine(this.scanDB, this.configDB);
    }

    static getInstance(): ScanService {
        if (!ScanService.instance) {
            ScanService.instance = new ScanService();
        }
        return ScanService.instance;
    }
    public async scanWebsites(
        domainIDs: number[],
        taskType: ScanTask,
        seedLinks: string[] = [],
        crawlParams: Partial<CrawlParams> = {},
    ): Promise<ScanPayload> {
        switch (taskType) {
            case "links": {
                return await this.scanEngine.scanLinks(
                    domainIDs,
                    seedLinks,
                    crawlParams,
                );
            }
            case "backlogs": {
                return await this.scanEngine.scanBacklogs(
                    domainIDs,
                    crawlParams,
                );
            }
            case "indexes": {
                return await this.scanEngine.scanIndexes(
                    domainIDs,
                    crawlParams,
                );
            }
            case "frontpages": {
                return await this.scanEngine.scanFrontpages(
                    domainIDs,
                    crawlParams,
                );
            }
            default: {
                throw new Error("invalid scan task type");
            }
        }
    }

    // DOMAIN CRUD

    async getDomains(domainIDs: number[]): Promise<DomainModel[]> {
        const result = await this.scanDB.readAllDomains();
        return result.filter(
            ({ domainID }) => domainID && domainIDs.includes(domainID),
        ) as DomainModel[];
    }

    async getAllDomains(limit?: number): Promise<DomainModel[]> {
        const result = await this.scanDB.readAllDomains();
        return result;
    }

    async createDomain(
        domainName: string,
        homeLink: string,
        region?: DomainRegion,
    ): Promise<number> {
        const domain = await this.scanDB.createDomain({
            domainName,
            homeLink,
            region,
        });

        log.info(
            `Created Domain (ID: ${domain.domainID}, Name: ${domainName}, Homepage: ${homeLink}) in WebDatabase Domains Table`,
        );

        // Create site config via WebEngine
        this.configDB.connect();
        const config = buildDefaultSiteConfig(homeLink);

        this.configDB.createConfig(config, domain.domainID);
        return domain.domainID;
    }

    async updateDomain(
        domainID: number,
        domain: Partial<DomainModel>,
    ): Promise<void> {
        const updatedDomain = await this.scanDB.updateDomain(domainID, domain);
    }

    async deleteDomain(domainID: number): Promise<void> {
        throw new Error("unimpl");
    }

    // SITE CONFIGS

    getSiteConfigs(domainIDs: number[]): SiteConfigModel[] {
        return this.configDB.getConfigs(domainIDs);
    }

    updateSiteConfig(
        partialConfig: Partial<SiteConfigModel>,
        configID: number,
    ): SiteConfigModel {
        return this.configDB.updateConfig(partialConfig, configID);
    }

    // MISC INFO

    async getDisabledDomainIDs(): Promise<number[]> {
        return await getDisabledDomainIDs(this.scanDB);
    }

    async getDomainInfo(domainID: number): Promise<DomainInfo> {
        return getDomainInfo(domainID, this.scanDB);
    }

    async getDatabaseInfo(): Promise<ScanDatabaseInfo> {
        return await getScanDatabaseInfo(this.scanDB);
    }
}
