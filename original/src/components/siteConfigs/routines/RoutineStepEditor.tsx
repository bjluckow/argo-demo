import { Dispatch, SetStateAction, useState } from "react";
import { PageRoutine, PageRoutineStep } from "@/engine/routines";
import InstructionsEditor from "./instructions/InstructionsEditor";
import { RenderDataInstruction } from "./instructions/dataInsns/RenderDataInstruction";
import { RenderActionInstruction } from "./instructions/actionInsns/RenderActionInstruction";
import { SectionCard, ButtonGroup, Button, Intent } from "@blueprintjs/core";

type RoutineStepEditorProps = {
    step: PageRoutineStep;
    stepIndex: number;
    isLastStep: boolean;
    moveUpHandler: (index: number) => void;
    moveDownHandler: (index: number) => void;
    deleteHandler: (index: number) => void;
    saveHandler: (step: PageRoutineStep, stepIndex: number) => void;
};

export default function RoutineStepEditor({
    step,
    stepIndex,
    isLastStep,
    moveUpHandler,
    moveDownHandler,
    deleteHandler,
    saveHandler,
}: RoutineStepEditorProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<PageRoutineStep>(step);

    const canSaveChanges = step !== currentStep;

    const handleSave = () => {
        saveHandler(currentStep, stepIndex);
        setIsEditing(false);
    };

    return (
        <SectionCard>
            <h1 className="font-semibold">Routine Step {stepIndex + 1}</h1>
            <ButtonGroup minimal={true}>
                <Button
                    icon="arrow-up"
                    onClick={() => moveUpHandler(stepIndex)}
                    small={true}
                    disabled={stepIndex === 0 || isEditing}
                />
                <Button
                    icon="arrow-down"
                    onClick={() => moveDownHandler(stepIndex)}
                    small={true}
                    disabled={isLastStep || isEditing}
                />

                <Button
                    icon={isEditing ? "eye-off" : "edit"}
                    onClick={() => setIsEditing((v) => !v)}
                    small={true}
                />

                <Button
                    icon="trash"
                    onClick={() => deleteHandler(stepIndex)}
                    small={true}
                />
            </ButtonGroup>

            <br />
            <br />

            {isEditing ? (
                <>
                    <InstructionsEditor
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                    />
                    <br />
                    <br />
                    <Button
                        text="Save Step Changes"
                        icon="new-layers"
                        onClick={handleSave}
                        disabled={!canSaveChanges}
                        intent={Intent.PRIMARY}
                    />
                </>
            ) : (
                <>
                    {currentStep.actionInsns &&
                        currentStep.actionInsns.length > 0 && (
                            <ol>
                                {currentStep.actionInsns.map(
                                    (action, actionIdx) => (
                                        <li key={actionIdx}>
                                            <RenderActionInstruction
                                                actionInsn={action}
                                                insnIndex={actionIdx}
                                            />
                                        </li>
                                    ),
                                )}
                            </ol>
                        )}

                    {currentStep.dataInsns.length > 0 && (
                        <ol>
                            {currentStep.dataInsns.map((dataInsn, idx) => (
                                <li key={idx}>
                                    <RenderDataInstruction
                                        dataInsn={dataInsn}
                                    />
                                </li>
                            ))}
                        </ol>
                    )}
                </>
            )}
        </SectionCard>
    );
}
