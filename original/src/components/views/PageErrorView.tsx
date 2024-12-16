"use client";
import { useState } from "react";
import {
    DomainModel,
    LinkPathnameModel,
    PageErrorModel,
} from "@/db/models";
import { Collapse, Button } from "@blueprintjs/core";


type PageErrorViewProps = {
    pageerror: PageErrorModel;
    link?: string;
};

export default function PageErrorView({ pageerror, link }: PageErrorViewProps) {
    const [showErrorMsg, setShowErrorMsg] = useState<boolean>(false);

    const startTime = new Date(pageerror.time).getTime();
    const twentyFourHoursLater = startTime + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const currentTime = Date.now();
    const remainingTime =
        (twentyFourHoursLater - currentTime) / (1000 * 60 * 60); // Convert to hours

    return (
        <div>
            <h2>
                {new Date(pageerror.time).toLocaleString()} (Cooldown:{" "}
                {remainingTime > 0
                    ? remainingTime.toFixed(1) + " hours remaining"
                    : "Cooldown complete"}
                )
            </h2>
            <h3 className="italic">{link}</h3>
            <br />

            <Button
                text={
                    showErrorMsg ? "Hide Error Log" : "Show Error Log"
                }
                onClick={() => setShowErrorMsg((v) => !v)}
            />

            <Collapse isOpen={showErrorMsg}>  
            <pre className="max-w-prose text-wrap py-2 text-sm text-white">
                {JSON.stringify(pageerror.blob, null, 4)}
                </pre>
            </Collapse>
        </div>
    );
}
