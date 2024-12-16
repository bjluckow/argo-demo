import Scraper from "../scraping/Scraper";
import { SiteAuth } from "./auth";
import { SiteRules } from "./rules";

export const DEFAULT_SITE_AUTH: SiteAuth = {
    method: { type: "none" },
    creds: { username: "", password: "" },
};
export const DEFAULT_SITE_RULES: SiteRules = {
    robotsText: "",
    ...Scraper.DEFAULT_SETTINGS,
} as const;
