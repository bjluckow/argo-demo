import {
    PageInstruction,
    PageInstructionSerial,
} from "@/engine/routines/instructions";
import { WebpageActionLabel } from "@/engine/routines/actions";
import { Dispatch, SetStateAction } from "react";
import PageElementInput from "./dataInsns/PageElementInput";
import PageElementGroupInput from "./dataInsns/PageElementGroupInput";
import PageMetaElementInput from "./dataInsns/PageMetaElementInput";
import LinkElementInput from "./dataInsns/LinkElementInput";

type InstructionInputProps = {
    insnSerial: PageInstructionSerial;
    setCurrentInsn: Dispatch<SetStateAction<PageInstruction | undefined>>;
};

export function InstructionInput({
    insnSerial,
    setCurrentInsn,
}: InstructionInputProps) {
    switch (insnSerial.insnType) {
        case "data": {
            const dataTypes = insnSerial.insnSubtype;
            const renderSubtypes = () => {
                switch (dataTypes) {
                    case "meta": {
                        return (
                            <PageMetaElementInput
                                setCurrentInsn={setCurrentInsn}
                            />
                        );
                    }
                    case "element": {
                        return (
                            <PageElementInput setCurrentInsn={setCurrentInsn} />
                        );
                    }
                    case "elementGroup": {
                        return (
                            <PageElementGroupInput
                                setCurrentInsn={setCurrentInsn}
                            />
                        );
                    }
                    case "fromLink": {
                        return (
                            <LinkElementInput setCurrentInsn={setCurrentInsn} />
                        );
                    }
                    default: {
                        return <>INVALID DATA INSTRUCTION SUBTYPE</>;
                    }
                }
            };
            return renderSubtypes();
        }
        case "action": {
            const actionTypes: WebpageActionLabel = insnSerial.insnSubtype;
            const renderSubtypes = () => {
                switch (actionTypes) {
                    case WebpageActionLabel.Click: {
                        return <>Click input</>;
                    }
                    case WebpageActionLabel.WaitFor: {
                        return <>Click input</>;
                    }
                    default: {
                        return <>INVALID ACTION INSTRUCTION SUBTYPE</>;
                    }
                }
            };
            return renderSubtypes();
        }
        default: {
            return <>INVALID INSTRUCTION SERIAL</>;
        }
    }
}
