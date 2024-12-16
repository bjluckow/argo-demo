"use client";
import { useState, useEffect } from "react";
import { SiteConfigModel } from "@/db/models";
import SiteConfig from "@/engine/sites/SiteConfig";
import { SitePaths } from "@/engine/sites/paths";
import SiteAuthEditor from "./SiteAuthEditor";
import SiteRulesEditor from "./SiteRulesEditor";
import SitePathsEditor from "./paths/SitePathsEditor";
import { Elevation, Card, Icon, Button, ButtonGroup } from "@blueprintjs/core";
import { serverUpdateConfig } from "../../app/_api/scanAPI";

type SiteConfigEditorProps = { siteConfig: SiteConfigModel };

export default function SiteConfigEditor({
    siteConfig,
}: SiteConfigEditorProps) {
    const [currentConfig, setCurrentConfig] =
        useState<SiteConfigModel>(siteConfig);

    useEffect(() => {
        setCurrentConfig(siteConfig);
    }, [siteConfig]);

    const updateConfig = async (partialConfig: Partial<SiteConfig>) => {
        const newConfig = await serverUpdateConfig(
            partialConfig,
            siteConfig._id,
        );
        setCurrentConfig(newConfig);
        return newConfig;
    };

    if (!siteConfig) {
        return <div>Loading configs...</div>;
    }

    return (
        <div className="my-5 min-w-full max-w-fit p-3 caret-transparent">
            <div className="my-5 flex flex-row justify-between">
                <div>
                    <h1 className="font-bold">
                        Hostname: {currentConfig.hostname}
                    </h1>
                    <h2 className="font-light">
                        Config ID: {currentConfig._id}
                    </h2>
                    <br />
                    <p>Paths: {siteConfig.paths.length}</p>
                    <p>Auth Method: {siteConfig.auth.method.type}</p>
                </div>
                <div>
                    <Button
                        text="Export Config JSON"
                        icon="download"
                        onClick={() => {
                            console.log("todo: export siteconfig json");
                        }}
                        minimal={true}
                        small={true}
                    />
                </div>
            </div>

            <div className="my-5 flex flex-row gap-x-32">
                <div className="min-w-1/3">
                    <SiteRulesEditor
                        rules={currentConfig.rules}
                        updateConfig={updateConfig}
                    />
                </div>
                {currentConfig.rules.robotsText !== "" && (
                    <div className="p-3">
                        <h2 className="font-semibold">Robots.txt</h2> <br />
                        {currentConfig.rules.robotsText}
                    </div>
                )}

                {/* 
                <div className="p-5 ">
                    <SiteAuthEditor
                        auth={currentConfig.auth}
                        updateConfig={updateConfig}
                    />
                </div> */}
            </div>
            <div className="my-5">
                <SitePathsEditor
                    paths={currentConfig.paths}
                    updateConfig={updateConfig}
                />
            </div>
        </div>
    );
}
