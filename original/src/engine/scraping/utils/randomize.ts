export function pickRandomUserAgent(userAgents: string[]): string {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export function randomizeVisitInterval(
    minIntervalMS: number,
    intervalNoiseMax: number,
): number {
    const intervalNoise = Math.floor(Math.random() * intervalNoiseMax);
    return minIntervalMS + intervalNoise;
}
