import { CompiledSitePaths, SitePath, compileSitePaths } from "./paths";
import { SiteAuth } from "./auth";
import { DEFAULT_SITE_AUTH } from "./configs";
import { SiteRules } from "./rules";
import { DEFAULT_SITE_RULES } from "./configs";

export default interface SiteConfig {
    homeLink: string;
    hostname: string;
    rules: SiteRules;
    auth: SiteAuth;
    paths: SitePath[];
}

export function buildDefaultSiteConfig(homeLink: string): SiteConfig {
    return {
        homeLink,
        hostname: new URL(homeLink).hostname,
        rules: DEFAULT_SITE_RULES,
        auth: DEFAULT_SITE_AUTH,
        paths: [],
    };
}
