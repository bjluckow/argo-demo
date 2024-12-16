import { PageRoutine } from "../routines";

// PATHS

export enum ReservedPathLabel {
    HOME = "HOMEPAGE",
    ROBOTS = "ROBOTS.TXT",
    SITEMAPINDEX = "SITEMAP-INDEX",
    SITEMAPLIST = "SITEMAP-LIST",
    SITEMAPMISC = "SITEMAP-MISC",
}

export type SitePaths = SitePath[];

export type SitePath = {
    label: string;
    pattern: string;
    routine: PageRoutine;
};

export type CompiledSitePaths = (Omit<SitePath, "pattern"> & {
    pattern: RegExp;
})[];

export function compileSitePaths(sitePaths: SitePath[]): CompiledSitePaths {
    return sitePaths.map((path) => {
        return { ...path, pattern: new RegExp(path.pattern) };
    });
}

export function matchPathnameToRoutine(
    url: URL,
    sitePaths: CompiledSitePaths,
): Omit<SitePath, "pattern"> | undefined {
    const pathName = url.pathname;
    for (const path of sitePaths) {
        if (path.pattern.test(pathName)) {
            return { label: path.label, routine: path.routine };
        }
    }
    return undefined;
}
