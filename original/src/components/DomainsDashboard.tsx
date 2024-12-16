import React, { useState } from "react";
import { DomainModel } from "@/db/models";

import DomainCreation from "./domain/DomainCreation";
import DomainSelect from "./domain/DomainSelect";
import DomainEditor from "./domain/DomainEditor";

import { Collapse, Icon, Button, Card } from "@blueprintjs/core";

type DomainsDashboardProps = {
    domains: DomainModel[];
    disabledDomainIDs: number[];
};

export default function DomainsDashboard({
    domains,
    disabledDomainIDs,
}: DomainsDashboardProps) {
    const [selectedDomain, setSelectedDomain] = useState<
        DomainModel | undefined
    >();
    const [isCreationOpen, setCreationOpen] = useState<boolean>(false);

    const jsonString = JSON.stringify(domains, null, 2);
    const bytes = new TextEncoder().encode(jsonString).length;
    const megabytes = (bytes / 2 ** 20).toFixed(2);
    const fileSize = `${megabytes} MB`;

    // const handleDownloadDomains = () => {
    //     const fileBlob = new Blob([jsonString], { type: "application/json" });
    //     const fileUrl = URL.createObjectURL(fileBlob);
    //     const link = document.createElement("a");
    //     link.href = fileUrl;
    //     link.download = "domains.json";
    //     document.body.appendChild(link);
    //     link.click();

    //     URL.revokeObjectURL(fileUrl);
    //     link.remove();
    // };

    return (
        <Card className="m-5 w-full rounded-xl border-2 caret-transparent shadow-sm">
            <h1 className="text-lg font-bold">Domains Dashboard</h1>
            <div className="p-3">
                <p>{domains.length} domains loaded</p>
                <p>{disabledDomainIDs.length} failed in past 24 hours</p>
                <div className="my-5 flex flex-row gap-x-2">
                    <Button
                        icon={isCreationOpen ? "disable" : "plus"}
                        className="mt-5 min-w-36"
                        onClick={() => setCreationOpen((v) => !v)}
                        text={isCreationOpen ? "Cancel" : "Create Domain"}
                    />

                    {/*  TODO: impl */}
                    <Button className="mt-5" disabled={true} icon="download">
                        Download Domains JSON: {fileSize || "Calculating..."}
                    </Button>
                </div>

                <Collapse isOpen={isCreationOpen}>
                    <DomainCreation />
                </Collapse>
            </div>

            <h2 className="font-semibold">Edit Domains</h2>
            <div className="w-full">
                <DomainSelect
                    domains={domains}
                    selectedDomain={selectedDomain}
                    selectDomainHandler={(domain: DomainModel) => {
                        setSelectedDomain(domain);
                    }}
                    disabledDomainIDs={disabledDomainIDs}
                />
                {selectedDomain && <DomainEditor domain={selectedDomain} />}
            </div>
            <div className="light my-20" />
        </Card>
    );
}
