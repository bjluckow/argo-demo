import ScrapingCoreError from "../scraping/utils/ScrapingCoreError";
import axios, { AxiosRequestConfig } from "axios";

export type FetchParams = {
    userAgent?: string;
    timeout?: number;
    auth?: FetchAuthCreds;
};

export type FetchAuthCreds = { username: string; password: string };

export type FetchResponse = {
    link: string;
    status: number;
    content: string;
};

export async function fetchURL(
    url: URL,
    params: FetchParams,
): Promise<FetchResponse> {
    const { userAgent, timeout, auth } = params;

    const config: AxiosRequestConfig = {
        headers: { "User-Agent": userAgent },
        timeout,
    };

    try {
        const response = await axios.get<string>(url.href, config);
        const fetchResult: FetchResponse = {
            link: url.href,
            status: response.status,
            content: response.data,
        };

        if (fetchResult.status !== 200) {
            throw new FetchError(FetchErrorType.BadResponse, {
                url,
                params,
                result: fetchResult,
            });
        }

        return fetchResult;
    } catch (error) {
        if (error instanceof FetchError) {
            throw error;
        }
        const result: FetchResponse | undefined =
            axios.isAxiosError(error) && error.response
                ? {
                      link: url.href,
                      status: error.response.status,
                      content: error.message,
                  }
                : undefined;

        throw new FetchError(
            undefined,
            { url, params, result },
            error as Error,
        );
    }
}

export enum FetchErrorType {
    Unknown = "Unknown Network error encountered.",
    Axios = "Axios-specific error occurred.",
    BadResponse = "Fetch Bad Reponse",
    Parsing = "Failed to parse response data.",
}

type FetchErrorContext = {
    url: URL;
    params: FetchParams;
    result?: FetchResponse;
};

export class FetchError extends ScrapingCoreError<
    FetchErrorType,
    FetchErrorContext
> {
    constructor(
        errorType: FetchErrorType | undefined,
        public context: FetchErrorContext,
        public caughtError?: Error,
    ) {
        super(
            FetchError.inferErrorType(errorType, caughtError),
            context,
            caughtError,
        );
        this.name = this.constructor.name;
    }

    private static inferErrorType(
        errorType?: FetchErrorType,
        caughtError?: Error,
    ): FetchErrorType {
        if (errorType) {
            return errorType;
        }

        if (!caughtError) {
            return FetchErrorType.Unknown;
        } else if (axios.isAxiosError(caughtError)) {
            return FetchErrorType.Axios;
        } else {
            return FetchErrorType.Unknown;
        }
    }
}
