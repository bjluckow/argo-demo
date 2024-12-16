import { useState } from "react";
import { SiteConfigModel } from "@/db/models";
import { SiteRules } from "@/engine/sites/rules";
import { NumericInput, Button, InputGroup, Icon } from "@blueprintjs/core";

type SiteRulesEditorProps = {
    rules: SiteRules;
    updateConfig: (
        partialConfig: Partial<SiteConfigModel>,
    ) => Promise<SiteConfigModel>;
};

const DEFAULT_RULES: Required<SiteConfigModel["rules"]> = {
    robotsText: "",
    minInterval: 5000,
    intervalNoiseMax: 3000,
    actionNoiseMax: 100,
    timeout: 10000,
};

const EXCLUDE_RULES: (keyof SiteRules)[] = ["robotsText"];

export default function SiteRulesEditor({
    rules,
    updateConfig,
}: SiteRulesEditorProps) {
    const [currentRules, setCurrentRules] =
        useState<SiteConfigModel["rules"]>(rules);

    const handleNumericValueChange = (
        field: keyof SiteConfigModel["rules"],
        newValue: number | string,
        valueAsString: string,
    ) => {
        const numericValue = isNaN(Number(newValue))
            ? currentRules[field] || 0
            : Number(newValue);
        setCurrentRules((prevRules) => ({
            ...prevRules,
            [field]: numericValue,
        }));
    };

    const handleStringValueChange = (
        field: keyof SiteConfigModel["rules"],
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const newValue = event.target.value;
        setCurrentRules((prevRules) => ({
            ...prevRules,
            [field]: newValue,
        }));
    };

    const renderInputField = (
        field: keyof SiteConfigModel["rules"],
        currentValue: any,
    ) => {
        const isNumeric = typeof currentValue === "number";
        return isNumeric ? (
            <NumericInput
                fill
                min={0}
                value={currentValue ?? 0}
                onValueChange={(newValue, valueAsString) =>
                    handleNumericValueChange(field, newValue, valueAsString)
                }
            />
        ) : (
            <InputGroup
                fill
                value={currentValue ?? ""}
                onChange={(event) => handleStringValueChange(field, event)}
            />
        );
    };

    return (
        <div className="my-5 ">
            <h1 className="font-semibold">
                Site Rules <Icon icon="wrench" />
            </h1>
            <br />
            <Button
                text="Save"
                icon="floppy-disk"
                onClick={() => updateConfig({ rules: currentRules })}
                disabled={currentRules === rules}
            />
            <div className="my-3 caret-white">
                {Object.entries(currentRules)
                    .filter(
                        ([rule, _]) =>
                            !EXCLUDE_RULES.includes(rule as keyof SiteRules),
                    )
                    .map(([field, currentValue]) => (
                        <div key={field} style={{ marginBottom: "10px" }}>
                            <h2 className="font-semibold">{field}</h2>
                            {renderInputField(
                                field as keyof SiteConfigModel["rules"],
                                currentValue,
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}
