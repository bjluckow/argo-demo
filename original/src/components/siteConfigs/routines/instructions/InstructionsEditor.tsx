import { useState, Dispatch, SetStateAction } from "react";
import { PageRoutineStep } from "@/engine/routines/routine";
import {
    PageInstructionSerial,
    PageInstruction,
    getInstructionSerial,
} from "@/engine/routines/instructions";
import { PageElementSelector } from "@/engine/scraping/locators/selectors";
import { RenderDataInstruction } from "./dataInsns/RenderDataInstruction";
import { CreateInstruction } from "./CreateInstruction";
import { RenderActionInstruction } from "./actionInsns/RenderActionInstruction";
import SelectInstruction from "./SelectInstruction";
import { Button, InputGroup } from "@blueprintjs/core";

type RoutineStepCreationProps = {
    currentStep: PageRoutineStep;
    setCurrentStep: Dispatch<SetStateAction<PageRoutineStep>>;
};

export default function InstructionsEditor({
    currentStep,
    setCurrentStep,
}: RoutineStepCreationProps) {
    const [selectedInsnSerial, setSelectedInsnSerial] = useState<
        PageInstructionSerial | undefined
    >();

    const { actionInsns: currentActionInsns, dataInsns: currentDataInsns } =
        currentStep;

    const handleAddInsn = (insn: PageInstruction) => {
        if (insn.insnType === "data") {
            setCurrentStep(({ actionInsns, dataInsns }) => {
                return {
                    actionInsns,
                    dataInsns: [...dataInsns, insn],
                };
            });
        } else if (insn.insnType === "action") {
            setCurrentStep(({ actionInsns, dataInsns }) =>
                actionInsns // Note implicit return
                    ? {
                          actionInsns: [...actionInsns, insn],
                          dataInsns,
                      }
                    : { actionInsns: [insn], dataInsns },
            );
        }
        setSelectedInsnSerial(undefined);
    };

    const handleDeleteInsn = (insnType: "action" | "data", index: number) => {
        if (insnType === "action" && currentActionInsns) {
            setCurrentStep((currentStep) => {
                return {
                    ...currentStep,
                    actionInsns: currentStep.actionInsns!.filter(
                        (_, insnIdx) => insnIdx !== index,
                    ),
                };
            });
        } else if (insnType === "data") {
            setCurrentStep((currentStep) => {
                return {
                    ...currentStep,
                    dataInsns: currentStep.dataInsns.filter(
                        (_, insnIdx) => insnIdx !== index,
                    ),
                };
            });
        }
    };

    return (
        <>
            <h1 className="font-semibold">Editing Instructions</h1>
            <br />

            {currentStep.actionInsns && currentStep.actionInsns.length > 0 ? (
                <ol>
                    {currentStep.actionInsns.map((action, actionInsnIdx) => (
                        <li key={actionInsnIdx}>
                            <Button
                                icon="small-cross"
                                small={true}
                                minimal={true}
                                onClick={() =>
                                    handleDeleteInsn("action", actionInsnIdx)
                                }
                            />

                            <RenderActionInstruction
                                actionInsn={action}
                                insnIndex={actionInsnIdx}
                            />
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="font-thin italic">No Action Instructions</p>
            )}

            <br />

            {currentStep.dataInsns.length > 0 ? (
                <ol>
                    {currentStep.dataInsns.map((dataInsn, dataInsnIdx) => (
                        <li key={dataInsnIdx}>
                            <Button
                                icon="small-cross"
                                small={true}
                                minimal={true}
                                onClick={() =>
                                    handleDeleteInsn("data", dataInsnIdx)
                                }
                            />
                            <RenderDataInstruction dataInsn={dataInsn} />
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="font-thin italic">No Data Instructions</p>
            )}

            <br />

            <h1 className="font-semibold">Add Instruction</h1>
            <br />
            <SelectInstruction
                selectedInsnID={selectedInsnSerial}
                setSelectedInsnID={setSelectedInsnSerial}
            />

            <br />

            {selectedInsnSerial && (
                <CreateInstruction
                    insnSerial={selectedInsnSerial}
                    saveHandler={handleAddInsn} // TODO: save handler
                />
            )}
        </>
    );
}
