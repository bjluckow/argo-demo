import { useState } from "react";
import RoutineEditor from "../routines/RoutineEditor";
import { PageRoutine } from "@/engine/routines";
import { SitePath } from "@/engine/sites/paths";
import { InputGroup, Button, Intent } from "@blueprintjs/core";

type SitePathCreationProps = {
    saveHandler: (newPath: SitePath) => void;
};

const EMPTY_PATH: SitePath = {
    label: "",
    pattern: "",
    routine: [],
} as const;

export default function SitePathCreation({
    saveHandler,
}: SitePathCreationProps) {
    const [path, setPath] = useState<SitePath>(EMPTY_PATH);

    const canSave =
        path.label !== "" && // TODO: check that label is unique
        path.pattern !== ""; // TODO: check that pattern is valid regexp

    const handleSave = () => {
        if (canSave) {
            saveHandler(path);
            // Reset fields
            setPath(EMPTY_PATH);
        }
    };

    return (
        <div>
            <InputGroup
                placeholder="Enter path label..."
                value={path.label}
                onValueChange={(label) =>
                    setPath((p) => {
                        return { ...p, label };
                    })
                }
            />
            <br />
            <InputGroup
                placeholder="Enter path pattern..."
                value={path.pattern}
                onValueChange={(pattern) =>
                    setPath((p) => {
                        return { ...p, pattern };
                    })
                }
            />
            <br />

            <RoutineEditor
                routine={path.routine}
                setRoutine={(routine: PageRoutine) => {
                    setPath((p) => {
                        return { ...p, routine };
                    });
                }}
            />
            <br />
            <Button
                text="Save Path"
                icon="git-push"
                onClick={handleSave}
                disabled={!canSave}
                intent={Intent.PRIMARY}
            />
        </div>
    );
}
