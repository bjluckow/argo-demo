import { useState, useCallback } from "react";
import { SiteConfigModel } from "@/services/scan";
import { SitePath, SitePaths } from "@/engine/sites/paths";
import SitePathCreation from "./SitePathCreation";
import SitePathEditor from "./SitePathEditor";
import {
    Button,
    Collapse,
    Elevation,
    Icon,
    Section,
    SectionCard,
} from "@blueprintjs/core";
import SitePathSelect from "./SitePathSelect";

type SitePathsEditorProps = {
    paths: SitePaths;
    updateConfig: (
        partialConfig: Partial<SiteConfigModel>,
    ) => Promise<SiteConfigModel>;
};

export default function SitePathsEditor({
    paths,
    updateConfig,
}: SitePathsEditorProps) {
    const [currentPaths, setCurrentPaths] = useState<SitePaths>(paths);
    const [selectedPath, setSelectedPath] = useState<SitePath>();
    const [showPathCreation, setShowPathCreation] = useState<boolean>(false);

    const handlePathCreation = async (newPath: SitePath) => {
        const newConfig = await updateConfig({ paths: [...paths, newPath] });
        setCurrentPaths(newConfig.paths);
        setShowPathCreation(false);
    };

    const handlePathUpdate = async (pathIndex: number, path: SitePath) => {
        const updatedPaths = [...paths];
        updatedPaths[pathIndex] = path;

        const newConfig = await updateConfig({ paths: updatedPaths });
        setCurrentPaths(newConfig.paths);
    };

    const handlePathDelete = async (pathIndex: number, path: SitePath) => {
        const filteredPaths = currentPaths.filter(
            (_, idx) => idx !== pathIndex,
        );
        const newConfig = await updateConfig({ paths: filteredPaths });
        setCurrentPaths(newConfig.paths);
    };

    return (
        <div>
            <h2 className="font-semibold">
                Site Paths <Icon icon="diagram-tree" />
            </h2>
            <br />

            <div className="flex flex-row gap-x-5 align-middle">
                <div>
                    <SitePathSelect
                        sitePaths={paths}
                        selectedPath={selectedPath}
                        setSelectedPath={setSelectedPath}
                    />
                </div>
                <div>
                    <Button
                        text={showPathCreation ? "Cancel" : "Create New Path"}
                        icon={showPathCreation ? "minus" : "plus"}
                        onClick={() => setShowPathCreation((v) => !v)}
                    />
                </div>
            </div>

            <Collapse isOpen={showPathCreation}>
                <SectionCard>
                    <h1 className="py-3 font-bold">
                        Create Path <Icon icon="path" />
                    </h1>

                    <SitePathCreation saveHandler={handlePathCreation} />
                </SectionCard>
            </Collapse>

            {selectedPath && (
                <Section className="my-5 p-3">
                    <SitePathEditor
                        path={selectedPath}
                        pathIndex={currentPaths.findIndex(
                            (p) => p.label === selectedPath.label,
                        )}
                        saveHandler={handlePathUpdate}
                        deleteHandler={handlePathDelete}
                    />
                </Section>
            )}
        </div>
    );
}
