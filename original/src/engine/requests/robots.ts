import { fetchURL, FetchParams, FetchResponse } from "./fetch";
import robotsParser, { Robot } from "robots-parser";
// See: https://www.npmjs.com/package/robots-parser?activeTab=readme

export type RobotsFetchResult = FetchResponse;

export async function fetchRobotsText(
    homeURL: URL,
    fetchParams: FetchParams,
): Promise<RobotsFetchResult> {
    const robotsURL = new URL("robots.txt", homeURL);
    const fetchResult = await fetchURL(robotsURL, fetchParams);

    return fetchResult;
}

export type RobotsParser = Robot;

export function buildRobotsParser(
    homeLink: string,
    robotsText: string,
): RobotsParser {
    return robotsParser(homeLink, robotsText);
}
