import { SiteConfigModel } from "../../../db/models";

export type SiteConfigVerificationResult = {};

export function verifySiteConfig(
    siteConfig: SiteConfigModel,
): SiteConfigVerificationResult {
    throw new Error("unimpl");
}
