export function sanitizeLinksIntoURLs(links: string[]): {
    validURLs: URL[];
    invalidLinks: string[];
} {
    const valid: URL[] = [];
    const invalid: string[] = [];
    for (const link of links) {
        if (URL.canParse(link)) {
            const parsedURL = new URL(link);
            valid.push(parsedURL);
        } else {
            invalid.push(link);
        }
    }
    return { validURLs: valid, invalidLinks: invalid };
}

export function groupURLsByHostname(
    urls: URL[],
): { hostname: string; urls: URL[] }[] {
    const hostnameMap = new Map<string, URL[]>();
    for (const url of urls) {
        if (hostnameMap.has(url.hostname)) {
            hostnameMap.get(url.hostname)!.push(url);
        } else {
            hostnameMap.set(url.hostname, [url]);
        }
    }
    return Array.from(hostnameMap.entries()).map(([hostname, urls]) => {
        return { hostname, urls };
    });
}
