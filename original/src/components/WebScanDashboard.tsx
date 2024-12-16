"use client";
import { useState, useEffect } from "react";
import { DomainModel } from "@/db/models";
import { ScanPayload } from "@/services/scan/engine";
import DomainMultiselect from "./domain/DomainMultiselect";
import ScanInputSummary from "./scan/ScanInputSummary";
import ScanControls from "./scan/ScanControls";
import ScanPayloadView from "./scan/ScanPayloadView";
import { Card } from "@blueprintjs/core";

type WebScanDashboardProps = {
    domains: DomainModel[];
    disabledDomainIDs: number[];
};

export default function WebScanDashboard({
    domains,
    disabledDomainIDs,
}: WebScanDashboardProps) {
    const [selectedDomains, setSelectedDomains] = useState<DomainModel[]>([]);
    const [scanPayload, setScanPayload] = useState<ScanPayload>();

    return (
        <Card className="m-5 p-3 caret-transparent">
            <h1 className="py-5 text-lg font-bold">Web Scan Dashboard</h1>
            <div className="flex flex-row">
                <div className="mb-5 w-full min-w-96">
                    <h1 className="py-5 font-semibold">Select Domains</h1>
                    <DomainMultiselect
                        domains={domains}
                        selectedDomains={selectedDomains}
                        setSelectedDomains={setSelectedDomains}
                        disabledDomainIDs={disabledDomainIDs}
                    />
                    <br />
                    <ScanInputSummary selectedDomains={selectedDomains} />
                </div>
                <div className="">
                    <ScanControls
                        selectedDomains={selectedDomains}
                        setPayload={(payload) => setScanPayload(payload)}
                    />
                </div>
            </div>

            {scanPayload && (
                <Card>
                    <ScanPayloadView payload={scanPayload} />
                </Card>
            )}
        </Card>
    );
}
