export function groupLinksByHostname(links: string[]): {
    hostname: string;
    urls: URL[];
}[] {
    const hostnameMap = new Map<string, URL[]>();
    for (const link of links) {
        if (URL.canParse(link)) {
            const url = new URL(link);
            if (hostnameMap.has(url.hostname)) {
                hostnameMap.get(url.hostname)!.push(url);
            } else {
                hostnameMap.set(url.hostname, [url]);
            }
        }
    }

    return Array.from(hostnameMap.entries()).map(([hostname, urls]) => {
        return { hostname, urls };
    });
}
