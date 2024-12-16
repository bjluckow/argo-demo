import { useState, Dispatch, SetStateAction } from "react";
import {
    InputGroup,
    Section,
    SectionCard,
    Button,
    Intent,
    Icon,
} from "@blueprintjs/core";

type PatternEditorProps = {
    currentPattern: string;
    setCurrentPattern: (pattern: string) => void;
};

export default function PatternEditor({
    currentPattern,
    setCurrentPattern,
}: PatternEditorProps) {
    const [patternInput, setPatternInput] = useState<string | undefined>();
    const [testInput, setTestInput] = useState<string | undefined>();
    const [testOutput, setTestOutput] = useState<boolean | undefined>();

    const handlePatternUpdate = () => {
        if (patternInput) {
            setCurrentPattern(patternInput);
            setPatternInput(undefined);
        }
    };

    const handleTest = () => {
        if (testInput && testInput !== "") {
            const regExp = new RegExp(patternInput ?? currentPattern);
            setTestOutput(regExp.test(testInput));
        }
    };

    return (
        <Section>
            <SectionCard>
                <h2>Enter New Pattern</h2>
                <InputGroup
                    className="caret-white"
                    placeholder={currentPattern}
                    value={patternInput}
                    onValueChange={(newValue) => {
                        setPatternInput(newValue);
                        if (testInput && testInput !== "") {
                            handleTest();
                        }
                    }}
                />
                <Button
                    text="Update Pattern"
                    onClick={handlePatternUpdate}
                    icon="git-push"
                    disabled={patternInput === undefined || patternInput === ""}
                />
                <br />
                <br />
                <h2>
                    Test Pattern{" "}
                    {patternInput === undefined && <>(Testing Current)</>}
                </h2>
                <InputGroup
                    className="caret-white"
                    placeholder="Enter string to test..."
                    value={testInput}
                    onValueChange={(newValue) => {
                        setTestInput(newValue);
                        if (newValue !== "") {
                            handleTest();
                        }
                    }}
                    intent={
                        testOutput === undefined
                            ? Intent.PRIMARY
                            : testOutput
                              ? Intent.SUCCESS
                              : Intent.DANGER
                    }
                />
                {testOutput !== undefined && (
                    <p>
                        {testOutput ? (
                            <Icon icon="tick" />
                        ) : (
                            <Icon icon="cross" />
                        )}{" "}
                        {testOutput
                            ? `Pathname  '${testInput}' matches pattern '${patternInput ?? currentPattern}'`
                            : `Pathname '${testInput}' does NOT Match pattern '${patternInput ?? currentPattern}'`}
                    </p>
                )}
            </SectionCard>
        </Section>
    );
}
