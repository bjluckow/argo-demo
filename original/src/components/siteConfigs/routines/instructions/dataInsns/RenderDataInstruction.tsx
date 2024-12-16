import { PageDataInstruction } from "@/engine/routines/instructions";

type RenderDataInstructionProps = { dataInsn: PageDataInstruction };

export function RenderDataInstruction({
    dataInsn,
}: RenderDataInstructionProps) {
    switch (dataInsn.dataType) {
        case "meta":
            switch (dataInsn.locator.level) {
                case "doc": {
                    return (
                        <>
                            <b>{dataInsn.category} </b>Meta - Document:{" "}
                            <i>{dataInsn.locator.docElement}</i>
                        </>
                    );
                }
                case "property": {
                    return (
                        <>
                            <b>{dataInsn.category} </b>Meta - Property:{" "}
                            <i>{dataInsn.locator.text}</i>
                        </>
                    );
                }
                case "name": {
                    return (
                        <>
                            <b>{dataInsn.category} </b>Meta - Name:{" "}
                            <i>{dataInsn.locator.text}</i>
                        </>
                    );
                }
                case "time": {
                    return (
                        <>
                            <b>{dataInsn.category} </b>Time
                        </>
                    );
                }
                default:
                    return <>INVALID META ELEMENT LOCATOR TYPE</>;
            }
        case "element":
            return (
                <>
                    <b>{dataInsn.category} </b> Element: {dataInsn.dataLabel}{" "}
                    <i>{dataInsn.locator.selText}</i>
                </>
            );
        case "elementGroup": {
            switch (dataInsn.locator.locType) {
                case "all":
                    return (
                        <>
                            <b>{dataInsn.category} </b>
                            Element Group - Query All: {dataInsn.dataLabel}
                            <i>{dataInsn.locator.selText}</i>
                        </>
                    );
                case "static":
                    return (
                        <>
                            <b>{dataInsn.category} </b>
                            Element Group - Static: {dataInsn.dataLabel}
                            <i>{dataInsn.locator.selTextList}</i>
                        </>
                    );
                case "range": {
                    const { selText, selWildcard, lower, upper } =
                        dataInsn.locator;
                    return (
                        <>
                            <b>{dataInsn.category} </b>
                            Element Group - Range ({lower}, {upper},
                            {selWildcard}): {dataInsn.dataLabel}{" "}
                            <i>{selText}</i>
                        </>
                    );
                }
                default:
                    return <>INVALID ELEMENT GROUP LOCATOR TYPE</>;
            }
        }
        case "fromLink": {
            return (
                <>
                    <b>{dataInsn.category}</b> From Link:{" "}
                    <i>{dataInsn.locator.pattern}</i>
                </>
            );
        }
        default:
            return <>INVALID DATA INSTRUCTION</>;
    }
}
