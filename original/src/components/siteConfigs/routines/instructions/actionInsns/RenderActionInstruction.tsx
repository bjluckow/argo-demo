import { PageActionInstruction } from "@/engine/routines/instructions";

type RenderActionInstructionProps = {
    actionInsn: PageActionInstruction;
    insnIndex: number;
};

export function RenderActionInstruction({
    actionInsn,
    insnIndex,
}: RenderActionInstructionProps) {
    return (
        <>
            Action {insnIndex + 1}: {actionInsn.actionType}{" "}
            {actionInsn.selector && <i>[{actionInsn.selector.selText}]</i>}
        </>
    );
}
