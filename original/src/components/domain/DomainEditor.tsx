"use client";
import { useState, useEffect } from "react";
import {
    DomainModel as DomainMetadataModel,
    DomainRegion,
} from "@/db/models";
import { SiteConfigModel } from "@/db/models";
import {
    serverGetDomainInfo,
    serverUpdateDomain,
    serverGetSiteConfigs,
} from "@/app/_api/scanAPI";
import SiteConfigEditor from "../siteConfigs/SiteConfigEditor";
import { DomainInfo } from "@/db/domainQueries";
import {
    Button,
    Collapse,
    Intent,
    TextArea,
    Tooltip,
} from "@blueprintjs/core";
import DomainInfoView from "./DomainInfoView";
import DomainRegionSelect from "./DomainRegionSelect";

type DomainEditorProps = { domain: DomainMetadataModel };

export default function DomainEditor({ domain }: DomainEditorProps) {
    const [showSiteConfig, setShowSiteConfig] = useState<boolean>(false);

    const [domainInfo, setDomainInfo] = useState<DomainInfo>();
    const [siteConfig, setSiteConfig] = useState<SiteConfigModel>();
    const [region, setRegion] = useState<DomainRegion | null>(
        domain.region as DomainRegion | null,
    );
    const [notes, setNotes] = useState<string>(domain.notes ?? "");

    useEffect(() => {
        setShowSiteConfig(false);

        const fetchDomainData = async () => {
            const [fetchedSiteConfig] = await serverGetSiteConfigs([
                domain.domainID,
            ]);
            const fetchedDomainInfo = await serverGetDomainInfo(
                domain.domainID,
            );

            setSiteConfig(fetchedSiteConfig);
            setDomainInfo(fetchedDomainInfo);
            setRegion(domain.region as DomainRegion | null);
            setNotes(domain.notes ?? "");
        };

        fetchDomainData();
    }, [domain]);

    const handleRegionSave = () => {
        serverUpdateDomain(domain.domainID, { region });
    };

    const handleNotesSave = () => {
        serverUpdateDomain(domain.domainID, { notes });
    };

    if (!domain || !siteConfig || !domainInfo) {
        return <div>Loading domain...</div>;
    }

    return (
        <div className="my-5 rounded-lg border-2 border-gray-500 p-5 caret-transparent shadow-sm shadow-gray-500">
            <div className="flex flex-row justify-between ">
                <div className="text-lg">
                    <Tooltip content={`ID: ${domain.domainID}`}>
                        <h1 className="font-bold">{domain.domainName}</h1>
                    </Tooltip>
                    <a href={domain.homeLink}>
                        <h2 className="font-semibold">{domain.homeLink}</h2>
                    </a>
                </div>
                <div className="flex flex-row gap-x-1 text-base">
                    <Button
                        text={
                            showSiteConfig
                                ? "Hide Site Config"
                                : "Edit Site Config"
                        }
                        onClick={() => setShowSiteConfig((v) => !v)}
                        icon={
                            showSiteConfig
                                ? "double-chevron-up"
                                : "double-chevron-down"
                        }
                        intent={Intent.PRIMARY}
                    />
                    <Button
                        text="Delete Domain"
                        icon="delete"
                        onClick={() => console.log("todo: delete domain")}
                        disabled={true}
                    />
                </div>
            </div>

            <div className="flex flex-row justify-between gap-x-20 text-base">
                <div className="w-full">
                    <DomainInfoView domain={domain} domainInfo={domainInfo} />
                </div>

                {/* Right side "control panel" */}
                <div className="h-full w-1/3 min-w-72 space-y-5">
                    <div className="flex flex-row justify-end gap-x-3 p-3">
                        <DomainRegionSelect
                            selectedRegion={region}
                            setSelectedRegion={setRegion}
                        />
                        <Button
                            text="Update Region"
                            onClick={handleRegionSave}
                            disabled={domain.region === region}
                            small={true}
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="border border-gray-200 caret-white">
                            <TextArea
                                placeholder="Edit domain notes..."
                                defaultValue={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                fill={true}
                            />
                        </div>
                        <br />
                        <Button
                            text="Save Notes"
                            onClick={handleNotesSave}
                            disabled={notes === domain.notes}
                        />
                    </div>
                </div>
            </div>

            {siteConfig && (
                <Collapse
                    isOpen={showSiteConfig}
                    className="min-w-3xl min-h-full"
                >
                   
                    <SiteConfigEditor siteConfig={siteConfig} />
                </Collapse>
            )}
        </div>
    );
}

{
    /* <div className="flex flex-row">
                <div>
                    <SiteConfigSummary siteConfig={siteConfig} />
                </div>
                <div>
                    <SiteRulesEditor
                        configID={siteConfig._id}
                        rules={siteConfig.rules}
                        updateCurrentConfig={(config) =>
                            setSiteConfig((c) => {
                                return { ...c, ...config } as SiteConfigModel;
                            })
                        }
                    />
                </div>
                <div></div>
            </div> */
}
