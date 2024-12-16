import { useState } from "react";
import { PageRoutine, PageRoutineStep } from "@/engine/routines/routine";
import InstructionsEditor from "./instructions/InstructionsEditor";
import RoutineStepEditor from "./RoutineStepEditor";
import { Button, SectionCard, Collapse, Intent } from "@blueprintjs/core";

const DEFAULT_NEW_STEP: PageRoutineStep = {
    actionInsns: [],
    dataInsns: [],
};

type RoutineEditorProps = {
    routine: PageRoutine;
    setRoutine: (routine: PageRoutine) => void;
};

export default function RoutineEditor({
    routine,
    setRoutine,
}: RoutineEditorProps) {
    const [showStepCreation, setShowStepCreation] = useState<boolean>(false);
    const [currentNewStep, setCurrentNewStep] =
        useState<PageRoutineStep>(DEFAULT_NEW_STEP);

    const toggleShowStepCreation = () => {
        if (showStepCreation) {
            setCurrentNewStep(DEFAULT_NEW_STEP);
        }
        setShowStepCreation((v) => !v);
    };

    const canAddNewStep: boolean = currentNewStep.dataInsns.length > 0;
    const handleAddNewStep = () => {
        if (currentNewStep.dataInsns.length > 0) {
            setRoutine([...routine, currentNewStep]);
            setCurrentNewStep(DEFAULT_NEW_STEP);
        }
    };

    const handleUpdateStep = (step: PageRoutineStep, stepIndex: number) => {
        const updatedRoutine = [...routine];
        updatedRoutine[stepIndex] = step;
        setRoutine(updatedRoutine);
    };

    const handleStepMoveUp = (index: number) => {
        // assuming index > 0
        if (index > 0) {
            const newRoutine = [...routine];
            const tempStep = newRoutine[index - 1];
            newRoutine[index - 1] = newRoutine[index];
            newRoutine[index] = tempStep;

            setRoutine(newRoutine);
        }
    };

    const handleStepMoveDown = (index: number) => {
        // assuming index < routine.length-1
        if (index < routine.length - 1) {
            const newRoutine = [...routine]; // Create a copy of the current routine
            const tempStep = newRoutine[index + 1];
            newRoutine[index + 1] = newRoutine[index];
            newRoutine[index] = tempStep;
            setRoutine(newRoutine);
        }
    };

    const handleStepDelete = (index: number) => {
        const filteredRoutine = routine.filter((_, i) => i !== index);
        setRoutine(filteredRoutine);
    };

    return (
        <div>
            {routine.map((step, stepIndex) => (
                <li key={stepIndex}>
                    <RoutineStepEditor
                        step={step}
                        stepIndex={stepIndex}
                        isLastStep={stepIndex === routine.length - 1}
                        moveUpHandler={handleStepMoveUp}
                        moveDownHandler={handleStepMoveDown}
                        deleteHandler={handleStepDelete}
                        saveHandler={handleUpdateStep}
                    />
                </li>
            ))}

            <div className="my-5">
                {showStepCreation ? (
                    <>
                        <Button
                            text="Cancel Step Creation"
                            icon="remove"
                            onClick={toggleShowStepCreation}
                        />
                        <Button
                            text="Add Step To Routine"
                            icon="new-layers"
                            onClick={handleAddNewStep}
                            disabled={!canAddNewStep}
                            intent={Intent.PRIMARY}
                        />
                    </>
                ) : (
                    <Button
                        text="Add New Step"
                        icon="add"
                        onClick={() => setShowStepCreation((v) => !v)}
                    />
                )}
            </div>

            <Collapse isOpen={showStepCreation}>
                <SectionCard>
                    <InstructionsEditor
                        currentStep={currentNewStep}
                        setCurrentStep={setCurrentNewStep}
                    />
                </SectionCard>
            </Collapse>
        </div>
    );
}
