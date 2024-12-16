import { useState, Dispatch, SetStateAction } from "react";
import { PageInstruction } from "@/engine/routines/instructions";
import { WebDataCategory } from "@/engine/scraping/categories";
import { PageDataInstruction } from "@/engine/routines/instructions";
import {
    PageDocumentElement,
    PageMetaLocator,
} from "@/engine/scraping/locators/meta";
import SelectDataCategory from "./SelectDataCategory";
import {
    RadioGroup,
    Radio,
    InputGroup,
    MenuItem,
    Button,
} from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";

type DataMetaElementInputProps = {
    setCurrentInsn: Dispatch<SetStateAction<PageInstruction | undefined>>;
};

type MetaLevel = PageMetaLocator["level"];

export default function PageMetaElementInput({
    setCurrentInsn,
}: DataMetaElementInputProps) {
    const [metaLevel, setMetaLevel] = useState<MetaLevel>("name");
    const [docLevelLabel, setDocLevelLabel] = useState<PageDocumentElement>();
    const [elementInput, setElementInput] = useState<string>();
    const [category, setCategory] = useState<WebDataCategory>();

    const canSave =
        (metaLevel === "doc" && docLevelLabel) ||
        (metaLevel === "property" && elementInput) ||
        (metaLevel === "name" && elementInput) ||
        metaLevel === "time";

    const handleSave = () => {
        if (metaLevel === "doc" && docLevelLabel) {
            const insn: PageDataInstruction = {
                insnType: "data",
                dataType: "meta",
                dataLabel: docLevelLabel,
                locator: { level: "doc", docElement: docLevelLabel },
                category,
            };
            setCurrentInsn(insn);
        }

        if (
            (metaLevel === "property" || metaLevel === "name") &&
            elementInput
        ) {
            const insn: PageDataInstruction = {
                insnType: "data",
                dataType: "meta",
                dataLabel: `meta-${elementInput}`,
                locator: { level: metaLevel, text: elementInput },
                category,
            };
            setCurrentInsn(insn);
        }

        if (metaLevel === "time") {
            const insn: PageDataInstruction = {
                insnType: "data",
                dataType: "meta",
                dataLabel: `meta-datetime`,
                category,
                locator: { level: metaLevel },
            };
            setCurrentInsn(insn);
        }
    };

    const renderDocDataLabelItem: ItemRenderer<PageDocumentElement> = (
        item,
        { handleClick, modifiers },
    ) => (
        <MenuItem
            active={modifiers.active}
            key={item ?? "No Category"}
            onClick={handleClick}
            text={item ?? "No Category"}
        />
    );

    return (
        <div>
            <br />
            <RadioGroup
                selectedValue={metaLevel}
                onChange={(e) =>
                    setMetaLevel(e.currentTarget.value as MetaLevel)
                }
            >
                <Radio label="Name" value="name" />
                <Radio label="Property" value="property" />
                <Radio label="Time" value="time" />
                <Radio label="Document" value="doc" />
            </RadioGroup>
            <br />
            {metaLevel === "doc" && (
                <>
                    <Select
                        items={[...Object.values(PageDocumentElement)]}
                        itemRenderer={renderDocDataLabelItem}
                        onItemSelect={(item: PageDocumentElement) =>
                            setDocLevelLabel(item)
                        }
                        filterable={false}
                        popoverProps={{ minimal: true }}
                    >
                        <Button
                            text={docLevelLabel ?? "Select Document Level Data"}
                            rightIcon="double-caret-vertical"
                        />
                    </Select>
                </>
            )}

            {(metaLevel === "property" || metaLevel === "name") && (
                <InputGroup
                    placeholder="Enter meta element text..."
                    value={elementInput}
                    onValueChange={(v) => setElementInput(v)}
                />
            )}

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
