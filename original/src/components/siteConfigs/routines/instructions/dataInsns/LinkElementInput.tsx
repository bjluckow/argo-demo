import { useState, Dispatch, SetStateAction, ChangeEvent } from "react";
import {
    PageInstruction,
    PageDataInstruction,
} from "@/engine/routines/instructions";
import { WebDataCategory } from "@/engine/scraping/categories";
import { PageElementGroupLocator } from "@/engine/scraping/locators/group";
import SelectDataCategory from "./SelectDataCategory";
import {
    Button,
    FormGroup,
    InputGroup,
    Radio,
    RadioGroup,
    TagInput,
    NumericInput,
} from "@blueprintjs/core";

type LinkElementGroupInputProps = {
    setCurrentInsn: (insn: PageInstruction | undefined) => void;
};

export default function LinkElementInput({
    setCurrentInsn,
}: LinkElementGroupInputProps) {
    const [label, setLabel] = useState<string>();
    const [pattern, setPattern] = useState<string>();
    const [category, setCategory] = useState<WebDataCategory | undefined>();

    const canSave = !!label && !!pattern;

    const handleSave = () => {
        if (!canSave) {
            return;
        }

        setCurrentInsn({
            insnType: "data",
            dataType: "fromLink",
            dataLabel: label,
            locator: { pattern: pattern },
            category,
        });
    };

    return (
        <div>
            <InputGroup
                placeholder="Enter element name..."
                value={label}
                onValueChange={(v) => setLabel(v)}
            />
            <br />
            <InputGroup
                placeholder="Enter regex pattern..."
                value={pattern}
                onValueChange={(v) => setPattern(v)}
            />
            <br />
            <SelectDataCategory category={category} setCategory={setCategory} />

            <br />
            <Button
                text="Save parameters"
                onClick={handleSave}
                disabled={!canSave}
            />
        </div>
    );
}
