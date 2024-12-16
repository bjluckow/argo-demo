import { ScraperSettings } from "../scraping/Scraper";

// RULES

//TODO: robotsText
export type SiteRules = {
    robotsText: string;
} & Pick<
    ScraperSettings,
    "timeout" | "minInterval" | "intervalNoiseMax" | "actionNoiseMax"
>;
