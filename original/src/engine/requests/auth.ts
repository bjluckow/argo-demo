import BaseWebpage from "../adapters/webpage";
import { FetchAuthCreds } from "./fetch";
import { PageRoutine } from "../routines/routine";

// TODO: DO NOT RANDOMIZE USER AGENT IF USING AUTH

export type WebAuth = {
    method: WebAuthMethod;
    creds: WebAuthCredentials;
};

export type WebAuthMethod =
    | { type: "none" }
    | { type: "http" }
    | { type: "form"; link: string; routine: PageRoutine };

export type WebAuthCredentials = FetchAuthCreds;

export async function authenticateWebpage(
    webpage: BaseWebpage,
    { method, creds }: WebAuth,
): Promise<boolean> {
    switch (method.type) {
        case "none": {
            return true;
        }
        case "http": {
            return await webpage.authenticateHTTP(
                creds.username,
                creds.password,
            );
        }
        case "form": {
            // Execute a routine to enter the credentials in a form
            throw new Error("unimpl");
        }
        default: {
            throw Error("Unknown authentication method");
        }
    }
}
