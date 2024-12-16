import { useState, useEffect } from "react";
import { SitePath } from "@/engine/sites/paths";
import RoutineEditor from "../routines/RoutineEditor";
import PatternEditor from "./PatternEditor";
import { Button, Collapse, Intent } from "@blueprintjs/core";

type SitePathEditorProps = {
    path: SitePath;
    pathIndex: number;
    saveHandler: (pathIndex: number, path: SitePath) => Promise<void>;
    deleteHandler: (pathIndex: number, path: SitePath) => Promise<void>;
};

export default function SitePathEditor({
    path,
    pathIndex,
    saveHandler,
    deleteHandler,
}: SitePathEditorProps) {
    const [currentPath, setCurrentPath] = useState<SitePath>(path);

    const [showPatternEditor, setShowPatternEditor] = useState<boolean>(false);
    const [showRoutine, setShowRoutine] = useState<boolean>(false);

    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
    const [lastActionMsg, setLastActionMsg] = useState<string>("");

    // Effect to reset states when path prop changes
    useEffect(() => {
        setShowPatternEditor(false);
        setShowRoutine(false);
        setConfirmDelete(false);
        setLastActionMsg("");

        setCurrentPath(path);
    }, [path]); // Dependency array includes path to trigger the effect when it changes

    const canSave = !shallowEqual(path, currentPath);

    const handleSave = () => {
        saveHandler(pathIndex, currentPath);
        setLastActionMsg("Saved Path Successfully");
    };

    const handleDelete = () => {
        if (confirmDelete) {
            setConfirmDelete(false);
            deleteHandler(pathIndex, path);
            setLastActionMsg("PATH DELETED");
        } else {
            setConfirmDelete(true);
        }
    };

    return (
        <div className="my-5 p-3">
            <h1 className="font-semibold">{path.label}</h1>
            <h2 className="font-extralight italic">{path.pattern}</h2>

            <div className="my-3 flex flex-row gap-x-1">
                <Button
                    text={showRoutine ? "Hide Routine" : "Show Routine"}
                    icon={showRoutine ? "menu-closed" : "menu-open"}
                    onClick={() => setShowRoutine((v) => !v)}
                />
                <Button
                    text={
                        showPatternEditor
                            ? "Close Pattern Editor"
                            : "Edit Pattern"
                    }
                    icon="regex"
                    onClick={() => setShowPatternEditor((v) => !v)}
                />

                <Button
                    text="Save Path"
                    icon="git-push"
                    onClick={handleSave}
                    disabled={!canSave}
                />

                {confirmDelete ? (
                    <Button
                        text="Confirm Deletion"
                        icon="cross-circle"
                        onClick={handleDelete}
                        intent={Intent.DANGER}
                    />
                ) : (
                    <Button
                        text="Delete Path"
                        icon="cross"
                        onClick={handleDelete}
                    />
                )}
            </div>

            <Collapse isOpen={showPatternEditor}>
                <PatternEditor
                    currentPattern={currentPath.pattern}
                    setCurrentPattern={(pattern) =>
                        setCurrentPath((p) => {
                            return { ...p, pattern };
                        })
                    }
                />
                <br />
            </Collapse>
            <Collapse isOpen={showRoutine}>
                <RoutineEditor
                    routine={currentPath.routine}
                    setRoutine={(routine) =>
                        setCurrentPath((p) => {
                            return { ...p, routine };
                        })
                    }
                />
            </Collapse>

            {lastActionMsg !== "" && <p>{lastActionMsg}</p>}
        </div>
    );
}

function shallowEqual(path1: SitePath, path2: SitePath) {
    const keys1 = Object.keys(path1) as (keyof SitePath)[];
    const keys2 = Object.keys(path2) as (keyof SitePath)[];

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (path1[key] !== path2[key]) {
            return false;
        }
    }

    return true;
}
