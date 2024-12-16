import { useState } from "react";
import {
    SiteCrawlResult,
    SerializedSiteCrawlError,
} from "@/engine/SiteCrawler";
import { Button, Collapse, Intent, SectionCard } from "@blueprintjs/core";

type SiteErrorLogProps = {
    errors: SiteCrawlResult["errors"];
    failedLinks: string[];
};

export default function SiteErrorLog({
    errors,
    failedLinks,
}: SiteErrorLogProps) {
    const [showErrorLog, setShowErrorLog] = useState<boolean>(false);

    if (failedLinks.length === 0 && errors.length === 0) {
        return <p>No Failures.</p>;
    }

    return (
        <div>
            <Button
                text={
                    showErrorLog
                        ? `Hide Errors`
                        : `Show ${errors.length} Errors`
                }
                intent={Intent.DANGER}
                onClick={() => setShowErrorLog((v) => !v)}
                small={true}
            />
            <br />
            <br />

            <Collapse isOpen={showErrorLog}>
                {errors.map((error, idx) => (
                    <ErrorRenderer key={idx} error={error} />
                ))}
                {/* {errors.map((e) => (
                    <p>{JSON.stringify(e)}</p>
                ))}
                {errors.map((e) => (
                    <p>{JSON.stringify(parseSiteCrawlerPathError(e))}</p>
                ))} */}
            </Collapse>
        </div>
    );
}

type ErrorRendererProps = { error: SerializedSiteCrawlError };

function ErrorRenderer({ error }: ErrorRendererProps) {
    const [primaryMsg, ...traceMsgs] = parseErrorMessage(error.errorMsg);

    return (
        <SectionCard>
            <h1 className="font-semibold">{error.link}</h1>
            <h2 className="font-medium">{primaryMsg.cause}</h2>
            Trace:
            {traceMsgs.map(({ cause, context }, index) => (
                <SectionCard key={index}>
                    <p>
                        Cause {index + 1}: {cause}
                    </p>
                    {context !== "" && (
                        <p>
                            Context:
                            <pre
                                style={{
                                    whiteSpace: "pre-wrap",
                                    wordWrap: "break-word",
                                }}
                            >
                                {JSON.stringify(JSON.parse(context), null, 4)}
                            </pre>
                        </p>
                    )}
                </SectionCard>
            ))}
        </SectionCard>
    );
}

function parseErrorMessage(
    errorMsg: string,
    acc: { cause: string; context: string }[] = [],
): { cause: string; context: string }[] {
    // Strip any "Caused by:" prefix globally before parsing
    errorMsg = errorMsg.replace(/Caused by:/g, "").trim();

    // Split only on the first occurrence of "|"
    const firstSplitIndex = errorMsg.indexOf("|");
    if (firstSplitIndex === -1) {
        // No more splits possible, push the remaining message as final error
        acc.push({ cause: errorMsg, context: "" });
        return acc;
    }

    const msg = errorMsg.substring(0, firstSplitIndex).trim();
    const restOfMessage = errorMsg.substring(firstSplitIndex + 1);

    const nextSplitIndex = restOfMessage.indexOf("|");
    if (nextSplitIndex === -1) {
        // Handle the last pair of error message and context
        const contextJSON = restOfMessage.replace("Context:", "").trim();
        acc.push({ cause: msg, context: contextJSON });
        return acc;
    }

    const contextJSON = restOfMessage
        .substring(0, nextSplitIndex)
        .replace("Context:", "")
        .trim();
    const remainingMessage = restOfMessage.substring(nextSplitIndex + 1);

    acc.push({ cause: msg, context: contextJSON });
    return parseErrorMessage(remainingMessage, acc);
}
