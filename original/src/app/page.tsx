"use client";
import { useState, useEffect } from "react";
import { serverGetAllDomains } from "./_api/scanAPI";
import { DomainModel } from "@/db/models";
import PageHeader from "@/components/PageHeader";
import DomainsDashboard from "@/components/DomainsDashboard";
import WebScanDashboard from "@/components/WebScanDashboard";
import AnalysisDashboard from "@/components/AnalysisDashboard";

export default function Home() {
    const [domains, setDomains] = useState<DomainModel[]>([]);
    const [disabledDomainIDs, setDisabledDomainIDs] = useState<number[]>([]);

    useEffect(() => {
        const fetchDomains = async () => {
            const { domains, disabledIDs } = await serverGetAllDomains();
            setDomains(domains);
            setDisabledDomainIDs(disabledIDs);
        };
        fetchDomains();
    }, []);

    return (
        <main>
            <PageHeader headerText="Scan Service" />
            <DomainsDashboard
                domains={domains}
                disabledDomainIDs={disabledDomainIDs}
            />
            <br />
            <WebScanDashboard
                domains={domains}
                disabledDomainIDs={disabledDomainIDs}
            />
            <br />
            <AnalysisDashboard />
            <br />
        </main>
    );
}
