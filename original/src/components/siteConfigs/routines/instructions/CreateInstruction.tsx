import { useState, Dispatch, SetStateAction } from "react";
import { InputGroup, Button } from "@blueprintjs/core";
import {
    PageInstructionSerial,
    PageInstruction,
} from "@/engine/routines/instructions";
import { InstructionInput } from "./InstructionInput";

type CreateInstructionProps = {
    insnSerial: PageInstructionSerial | undefined;
    saveHandler: (insn: PageInstruction) => void;
};

export function CreateInstruction({
    insnSerial,
    saveHandler,
}: CreateInstructionProps) {
    const [currentInsn, setCurrentInsn] = useState<PageInstruction | undefined>(
        undefined,
    );

    const canCreate: boolean = !!insnSerial && !!currentInsn;

    const handleCreate = () => {
        if (!canCreate || !currentInsn) {
            return;
        }

        saveHandler(currentInsn);
        setCurrentInsn(undefined);
    };

    if (!insnSerial) {
        return <p>Invalid Instruction</p>;
    }

    return (
        <>
            <h1 className="font-semibold">Instuction Parameters</h1>

            <InstructionInput
                insnSerial={insnSerial}
                setCurrentInsn={setCurrentInsn}
            />

            <br />
            <br />
            <Button
                text="Add Instruction to Step"
                icon="new-layer"
                onClick={handleCreate}
                disabled={!canCreate}
            />
        </>
    );
}
