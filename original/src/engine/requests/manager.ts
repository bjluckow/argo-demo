import { USER_AGENTS_1 } from "./configs";

export class NetworkManager {
    static DEFAULT_USER_AGENTS = USER_AGENTS_1;

    private currentUserAgent: string;
    constructor(
        readonly userAgents: string[] = NetworkManager.DEFAULT_USER_AGENTS,
    ) {
        if (userAgents.length === 0) {
            throw new Error(
                "failed to init network manager: no user agents provided",
            );
        }

        this.currentUserAgent = userAgents[0];
    }

    getUserAgent() {
        return this.currentUserAgent;
    }

    shuffleUserAgent() {
        return this.getUserAgent();
    }
}
