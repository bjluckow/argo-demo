import { useState } from "react";
import { ScrapedData, ScrapedDataValue } from "@/engine/scraping/scrape";
import { WebDataCategory } from "@/engine/scraping/categories";
import ResultsList from "./ResultsList";
import { MultiSelect, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { Button, Intent, MenuItem } from "@blueprintjs/core";

type ScrapedDataViewProps = { scrapedData: ScrapedData };

const LOAD_ELEMENT_STEP_SIZE = 5;

export default function ScrapedDataView({ scrapedData }: ScrapedDataViewProps) {
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

    const { values, badLabels } = scrapedData;

    const categories: string[] = [
        "No Category",
        ...Object.values(WebDataCategory).map((value) => value.toString()),
    ];

    const filteredData = values.filter(
        (value) =>
            selectedFilters.length === 0 ||
            selectedFilters.includes(value.category || "No Category"),
    );

    const renderFilter: ItemRenderer<string> = (
        filter,
        { handleClick, modifiers },
    ) => {
        if (!modifiers.matchesPredicate) return null;

        return (
            <MenuItem
                key={filter}
                roleStructure="listoption"
                onClick={handleClick}
                text={filter}
                shouldDismissPopover={true}
            />
        );
    };

    const filterCategories: ItemPredicate<string> = (query, filter) => {
        return filter.toLowerCase().includes(query.toLowerCase());
    };

    return (
        <div>
            <h1 className="mb-3 font-semibold">
                {values.length} Elements Scraped ({badLabels.length} missed)
            </h1>

            <MultiSelect
                items={categories.filter((f) => !selectedFilters.includes(f))}
                placeholder="Filter by data category"
                itemRenderer={renderFilter}
                itemPredicate={filterCategories}
                onItemSelect={(item) =>
                    setSelectedFilters([...selectedFilters, item])
                }
                selectedItems={selectedFilters}
                tagRenderer={(item) => item}
                tagInputProps={{
                    onRemove: (item) =>
                        setSelectedFilters(
                            selectedFilters.filter((f) => f !== item),
                        ),
                }}
                popoverProps={{ minimal: true }}
            />
            <br />

            <ResultsList<ScrapedDataValue>
                name="Data Elements"
                collapsible={false}
                results={filteredData}
                renderData={(value) => (
                    <ScrapedDataValueView dataValue={value} />
                )}
                defaultNum={5}
                showMoreStepSize={5}
            />
        </div>
    );
}

type ScrapedDataValueViewProps = {
    dataValue: ScrapedDataValue;
};

function ScrapedDataValueView({ dataValue }: ScrapedDataValueViewProps) {
    const { data, dataLabel, category } = dataValue;

    return (
        <div>
            <h2 className="font-semibold">{dataLabel}</h2>
            <h2 className="font-light">{category}</h2>

            <p>{JSON.stringify(data)}</p>
        </div>
    );
}
