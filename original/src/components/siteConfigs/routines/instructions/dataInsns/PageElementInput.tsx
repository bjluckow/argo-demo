import { useState, Dispatch, SetStateAction } from "react";
import {
    PageInstruction,
    PageDataInstruction,
} from "@/engine/routines/instructions";
import { WebDataCategory } from "@/engine/routines/pageData/categories";
import SelectDataCategory from "./SelectDataCategory";
import { InputGroup, Button } from "@blueprintjs/core";

const CSS_SELECTOR_REGEX: RegExp = /^(\s*(#[\w-]+|\.[\w-]+|\w+)+\s*(>|$))/;
const XPATH_SELECTOR_REGEX: RegExp =
    /^\/(?:\w+\/)*\w+(?:\[\d+\])?(?:\/\w+(?:\[\d+\])?)*$/;

type PageElementInputProps = {
    setCurrentInsn: Dispatch<SetStateAction<PageInstruction | undefined>>;
};

export default function PageElementInput({
    setCurrentInsn,
}: PageElementInputProps) {
    const [elementName, setElementName] = useState<string>();
    const [category, setCategory] = useState<WebDataCategory | undefined>();
    const [selector, setSelector] = useState<string>();

    const classifySelector = (
        selector: string,
    ): "css" | "xpath" | undefined => {
        if (CSS_SELECTOR_REGEX.test(selector)) {
            return "css";
        } else if (XPATH_SELECTOR_REGEX.test(selector)) {
            return "xpath";
        } else {
            return undefined;
        }
    };
    const selType = classifySelector(selector ?? "");

    const canSave = !!elementName && !!selector;

    const handleSave = () => {
        if (!canSave) {
            return;
        }

        const insn: PageDataInstruction = {
            insnType: "data",
            dataType: "element",
            dataLabel: elementName,
            locator: { selType: selType ?? "css", selText: selector },
            category,
        };
        setCurrentInsn(insn);
    };

    return (
        <>
            <InputGroup
                placeholder="Enter element name..."
                value={elementName ?? ""}
                onChange={(e) => setElementName(e.target.value)}
            />
            <InputGroup
                placeholder="Enter CSS selector or XPath..."
                value={selector ?? ""}
                onChange={(e) => setSelector(e.target.value)}
            />
            {selType && <p>Selector Type: {selType}</p>}
            <br />

            <SelectDataCategory category={category} setCategory={setCategory} />

            <br />
            <Button
                text="Save parameters"
                onClick={handleSave}
                disabled={!canSave}
            />
        </>
    );
}
