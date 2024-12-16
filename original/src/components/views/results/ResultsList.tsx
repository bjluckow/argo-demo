import { useState } from "react";
import {
    Collapse,
    Card,
    Button,
    Intent,
    SectionCard,
    Section,
} from "@blueprintjs/core";

type ResultListProps<R> = {
    name: string;
    collapsible: boolean;
    results: R[];
    renderData: (result: R, index: number) => React.JSX.Element | undefined;
    defaultNum: number;
    showMoreStepSize: number;
};

export default function ResultsList<R>({
    name,
    results,
    collapsible,
    renderData,
    defaultNum,
    showMoreStepSize,
}: ResultListProps<R>) {
    const [showResults, setShowResults] = useState<boolean>(!collapsible);
    const [numShown, setNumShown] = useState<number>(defaultNum);

    const handleShowAndHide = () => {
        setShowResults((v) => !v);
        setNumShown(defaultNum);
    };

    return (
        <div>
            {collapsible && (
                <div className="">
                    <Button
                        text={
                            showResults
                                ? `Hide ${name}`
                                : `Show ${results.length} ${name}`
                        }
                        onClick={handleShowAndHide}
                        intent={Intent.PRIMARY}
                        disabled={results.length === 0}
                    />
                </div>
            )}

            <Collapse isOpen={showResults}>
                {results.slice(0, numShown).map((result, idx) => (
                    <SectionCard>{renderData(result, idx)}</SectionCard>
                ))}

                {numShown < results.length && (
                    <SectionCard>
                        <Button
                            text={`Show ${Math.min(results.length - numShown, showMoreStepSize)} More ${name}`}
                            icon="expand-all"
                            onClick={() =>
                                setNumShown((n) => n + showMoreStepSize)
                            }
                            intent={Intent.PRIMARY}
                            small={true}
                        />
                    </SectionCard>
                )}
            </Collapse>
        </div>
    );
}
