import { SetStateAction, useState, Dispatch, useCallback } from "react";
import { InputGroup, RadioGroup, Radio } from "@blueprintjs/core";
import { PageElementSelector } from "@/engine/scraping/locators/selectors";

type SelectorInputProps = {
    selector: PageElementSelector;
    setSelector: Dispatch<SetStateAction<PageElementSelector>>;
};

export default function SelectorInput({
    selector,
    setSelector,
}: SelectorInputProps) {
    const [selText, setSelText] = useState<string>();
    const [selType, setSelType] =
        useState<PageElementSelector["selType"]>("css");
    const handleSelTypeChange = useCallback(
        (event: React.FormEvent<HTMLInputElement>) => {
            setSelType(
                event.currentTarget.value as PageElementSelector["selType"],
            );
        },
        [],
    );

    return (
        <div>
            <RadioGroup
                selectedValue={selType}
                onChange={handleSelTypeChange}
                label="Schema Type"
            >
                <Radio
                    label="CSS Selector"
                    value={"css" as PageElementSelector["selType"]}
                />
                <Radio
                    label="XPath"
                    value={"xpath" as PageElementSelector["selType"]}
                />
            </RadioGroup>
            <br />
            <InputGroup
                placeholder="Enter CSS selector or XPath..."
                value={selector.selText ?? ""}
                onValueChange={(value) => setSelText(value)}
            />
        </div>
    );
}
