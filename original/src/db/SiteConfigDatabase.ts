import { SCAN_DB_LOGGER } from "./utils/dbLogger";
import { JSONFileSync } from "lowdb/node";
import { LowSync } from "lowdb";
import SiteConfig from "@/engine/sites/SiteConfig";
import { SitePath } from "@/engine/sites/paths";
import { SiteConfigModel } from "./models";

const log = SCAN_DB_LOGGER.getSubLogger({ name: "ConfigsDB" });

type SiteConfigData = { siteConfigData: SiteConfigModel[] };

type SiteConfigsDatabaseType = LowSync<SiteConfigData>;

const DEFAULT_CONFIGS_PATH = "./data/siteConfigs.json";

/**
 * Light wrapper for LowDB JSON database
 */
export default class SiteConfigDatabase {
    private readonly DB_PATH =
        process.env.SITE_CONFIGS_PATH ?? DEFAULT_CONFIGS_PATH;
    private static _instance: SiteConfigDatabase;
    private _db?: SiteConfigsDatabaseType;

    private static readonly DEFAULT_DATA: SiteConfigData = {
        siteConfigData: [],
    };

    private constructor() {}

    static getInstance(): SiteConfigDatabase {
        if (!SiteConfigDatabase._instance) {
            SiteConfigDatabase._instance = new SiteConfigDatabase();
        }
        return SiteConfigDatabase._instance;
    }

    connect(): SiteConfigsDatabaseType {
        this._db = new LowSync(
            new JSONFileSync<SiteConfigData>(this.DB_PATH),
            SiteConfigDatabase.DEFAULT_DATA,
        );

        this._db.read();
        log.debug(
            `Connected SiteConfigs JSON Database at '${this.DB_PATH}' connected. (${this._db.data.siteConfigData.length} configs loaded)`,
        );
        return this._db;
    }

    private get db(): SiteConfigsDatabaseType {
        if (!this._db) {
            return this.connect();
        }
        return this._db;
    }

    // SITE CONFIG OPERATIONS

    // CREATE
    // NOTE: Call write() if not using update()

    /**
     *
     * @param siteConfig
     * @param id
     * @returns
     */
    createConfig(siteConfig: SiteConfig, id: number) {
        // Check for existing hostname -> update ID
        const preexistingConfig = this.db.data.siteConfigData.find(
            (sc) => sc.hostname === siteConfig.hostname,
        );

        if (preexistingConfig) {
            this.changeConfigID(preexistingConfig._id, id);
            log.warn(
                `CREATE: Found preexisting config for ${siteConfig.homeLink}, changed ID (original id: ${preexistingConfig._id}, new id: ${id})`,
            );
            return;
        }

        // Check for existing ID

        const collisionIndex = this.db.data.siteConfigData.find(
            (sc) => sc._id === id,
        );

        if (collisionIndex) {
            throw new SiteConfigDatabaseError(
                SiteConfigDatabaseErrorType.Collision,
                { configID: id },
            );
        }

        this.db.data.siteConfigData.push({
            ...siteConfig,
            _id: id,
        });

        this.db.write();
        log.info(
            `Created SiteConfig (id: ${id}, hostname: ${siteConfig.hostname})`,
        );
    }

    // GET CONFIG

    /**
     *
     * @returns
     */
    getAllConfigs(): SiteConfigModel[] {
        const allConfigs = this.db.data.siteConfigData;
        log.info(`Retrieved all ${allConfigs.length} site configs`);
        return allConfigs;
    }

    /**
     *
     * @param ids
     * @returns
     */
    getConfigs(ids: number[]): SiteConfigModel[] {
        const configs = ids.map((id) => this.getConfig(id));
        log.info(`Retrieved ${configs.length} site configs`);
        return configs;
    }

    /**
     *
     * @param id
     * @returns
     */
    getConfig(id: number): SiteConfigModel {
        const matchedConfig = this.db.data.siteConfigData.find(
            (siteConfig) => siteConfig._id === id,
        );

        if (!matchedConfig) {
            throw new SiteConfigDatabaseError(
                SiteConfigDatabaseErrorType.ConfigNotFound,
                { configID: id },
            );
        }

        log.info(
            `Retrived site config for ${matchedConfig.hostname} (id: ${id})`,
        );

        return matchedConfig;
    }

    // DELETE CONFIG

    /**
     *
     * @param id
     */
    deleteConfig(id: number): boolean {
        const originalNumConfigs = this.db.data.siteConfigData.length;

        this.db.data.siteConfigData = this.db.data.siteConfigData.filter(
            (siteConfig) => siteConfig._id !== id,
        );
        this.db.write();
        log.info(`Deleted site config (id ${id})`);

        return this.db.data.siteConfigData.length === originalNumConfigs - 1;
    }

    // UPDATE CONFIG

    /**
     *
     * @param updatedConfig
     * @param id
     */
    updateConfig(
        updatedConfig: Partial<SiteConfigModel>,
        id: number,
    ): SiteConfigModel {
        const existingConfig = this.getConfig(id);
        const matchIndex = this.matchConfigIndex(id);

        const newConfig = { ...existingConfig, ...updatedConfig, _id: id };

        this.db.data.siteConfigData[matchIndex] = newConfig;
        this.db.write();
        log.info(
            `Updated site config for ${existingConfig.hostname} (id: ${id}, index ${matchIndex})`,
        );
        return newConfig;
    }

    /**
     *
     * @param id
     * @returns
     */
    private matchConfigIndex(id: number): number {
        const matchIndex = this.db.data.siteConfigData.findIndex(
            (sc) => sc._id === id,
        );

        if (matchIndex === -1) {
            throw new SiteConfigDatabaseError(
                SiteConfigDatabaseErrorType.ConfigNotFound,
                { configID: id },
            );
        }

        return matchIndex;
    }

    /**
     *
     * @param currentID
     * @param newID
     * @returns
     */
    private changeConfigID(currentID: number, newID: number) {
        if (currentID === newID) {
            return;
        }

        const collisionIndex = this.db.data.siteConfigData.findIndex(
            (sc) => sc._id === newID,
        );

        if (collisionIndex) {
            throw new SiteConfigDatabaseError(
                SiteConfigDatabaseErrorType.Collision,
                { configID: currentID, newID },
            );
        }

        const configIndex = this.matchConfigIndex(currentID);
        const config = this.db.data.siteConfigData[configIndex];

        this.db.data.siteConfigData[configIndex] = { ...config, _id: newID };
        log.info(
            `Changed config ID for ${config.hostname} (prev id: ${currentID}, new id: ${newID})`,
        );
    }
}

// ERRORS

export enum SiteConfigDatabaseErrorType {
    ConfigNotFound = "Failed to locate site config ID",
    ConfigDuplicate = "Duplicate site config ID", // TODO: impl
    ConfigHostnameNotFound = "Failed to locate site config hostname", // TODO: impl
    ConfigHostnameDuplicate = "Duplicate site config hostname", // TODO: impl
    Collision = "ID Change Collision: config with new ID already exists",
}

type SiteConfigDatabaseErrorContext = {
    configID: number;
    pathLabel?: string;
    newID?: number;
    pathError?: unknown;
};

export class SiteConfigDatabaseError extends Error {
    constructor(
        public errorType: SiteConfigDatabaseErrorType,
        public context: SiteConfigDatabaseErrorContext,
    ) {
        super(SiteConfigDatabaseError.buildMsg(errorType, context));
        log.error(this.message);
    }

    private static buildMsg(
        errorType: SiteConfigDatabaseErrorType,
        {
            configID,
            pathLabel,
            newID,
            pathError,
        }: SiteConfigDatabaseErrorContext,
    ): string {
        let msg = `ConfigDB Error: ${errorType} (id: ${configID})`;
        if (pathLabel) {
            msg += ` (path label: ${pathLabel})`;
        }
        if (newID) {
            msg += ` (new id: ${newID})`;
        }

        return msg;
    }
}
