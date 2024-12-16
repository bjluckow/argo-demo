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

type PageElementGroupInputProps = {
    setCurrentInsn: (insn: PageInstruction | undefined) => void;
};

const SEL_TEXT_LIST_DELIM = ",";
const DEFAULT_WILDCARD_CHAR = "?";

export default function PageElementGroupInput({
    setCurrentInsn,
}: PageElementGroupInputProps) {
    const [elementGroupName, setElementGroupName] = useState<string>("");
    const [category, setCategory] = useState<WebDataCategory | undefined>();
    const [locType, setLocType] =
        useState<PageElementGroupLocator["locType"]>("all");
    const [selText, setSelText] = useState<string>("");
    const [selWildcard, setSelWildcard] = useState<string | undefined>();
    const [lowerBound, setLowerBound] = useState<number>(1);
    const [upperBound, setUpperBound] = useState<number>(100);

    const canSave =
        !!elementGroupName &&
        ((locType === "all" && selText !== "") ||
            (locType === "static" && selText !== "") ||
            (locType === "range" &&
                lowerBound <= upperBound &&
                selText.includes(selWildcard ?? DEFAULT_WILDCARD_CHAR)));

    const handleSave = () => {
        if (!canSave) {
            return;
        }

        switch (locType) {
            case "all": {
                const insn: PageDataInstruction = {
                    insnType: "data",
                    dataType: "elementGroup",
                    dataLabel: elementGroupName,
                    category: category,
                    locator: {
                        selType: "css",
                        locType: "all",
                        selText,
                    },
                };

                setCurrentInsn(insn);
                break;
            }
            case "static": {
                const insn: PageDataInstruction = {
                    insnType: "data",
                    dataType: "elementGroup",
                    dataLabel: elementGroupName,
                    category: category,
                    locator: {
                        selType: "xpath",
                        locType: "static",
                        selTextList: selText.split(SEL_TEXT_LIST_DELIM),
                    },
                };

                setCurrentInsn(insn);
                break;
            }
            case "range": {
                const insn: PageDataInstruction = {
                    insnType: "data",
                    dataType: "elementGroup",
                    dataLabel: elementGroupName,
                    category: category,
                    locator: {
                        selType: "xpath",
                        locType: "range",
                        selText,
                        selWildcard: selWildcard ?? DEFAULT_WILDCARD_CHAR,
                        lower: lowerBound,
                        upper: upperBound,
                    },
                };

                setCurrentInsn(insn);
                break;
            }
        }
    };

    return (
        <div>
            <InputGroup
                placeholder="Enter element group name..."
                value={elementGroupName}
                onChange={(e) => setElementGroupName(e.target.value)}
            />
            <br />

            <RadioGroup
                label="Locator type"
                selectedValue={locType}
                onChange={(e) =>
                    setLocType(
                        e.currentTarget
                            .value as PageElementGroupLocator["locType"],
                    )
                }
            >
                <Radio label="Query All (CSS)" value="all" />
                <Radio label="Static (XPath)" value="static" />
                <Radio label="Range (XPath)" value="range" />
            </RadioGroup>

            <br />

            {locType === "all" && (
                <InputGroup
                    placeholder="Enter CSS selector"
                    value={selText}
                    onValueChange={(v) => setSelText(v)}
                />
            )}

            {locType === "static" && (
                <InputGroup
                    placeholder={`Enter selectors separated by '${SEL_TEXT_LIST_DELIM}'...`}
                    value={selText}
                    onValueChange={(v) => setSelText(v)}
                />
            )}

            {locType === "range" && (
                <div>
                    <div className="caret-black">
                        <InputGroup
                            placeholder="Enter CSS selector or XPath for range..."
                            value={selText}
                            onValueChange={(v) => setSelText(v)}
                        />

                        <InputGroup
                            placeholder={`Wildcard character (default: "${DEFAULT_WILDCARD_CHAR}")`}
                            value={selWildcard}
                            onChange={(e) => setSelWildcard(e.target.value)}
                        />
                        {selText !== "" &&
                            !selText.includes(
                                selWildcard ?? DEFAULT_WILDCARD_CHAR,
                            ) && (
                                <p>
                                    Invalid Selector: does not include wildcard
                                    character
                                </p>
                            )}

                        <br />

                        <FormGroup label="Lower bound">
                            <NumericInput
                                value={lowerBound}
                                onValueChange={(valueAsNumber) =>
                                    setLowerBound(valueAsNumber)
                                }
                                min={1}
                            />
                        </FormGroup>
                        <FormGroup label="Upper bound">
                            <NumericInput
                                value={upperBound}
                                onValueChange={(valueAsNumber) =>
                                    setUpperBound(valueAsNumber)
                                }
                                min={1}
                            />
                        </FormGroup>
                    </div>
                </div>
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
