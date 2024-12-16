"use client";
import { DomainModel, DomainRegion } from "@/db/models";
import { MenuItem, Button, Intent } from "@blueprintjs/core";
import {
    ItemPredicate,
    ItemRenderer,
    Select,
    MultiSelect,
} from "@blueprintjs/select";
import { useState } from "react";

type DomainSelectProps = {
    domains: DomainModel[];
    selectedDomain: DomainModel | undefined;
    selectDomainHandler: (domain: DomainModel) => void;
    disabledDomainIDs: number[];
};

enum FilterTag {
    ERRORS = "Has errors",
    NO_PATHS = "No paths configured", // TODO: impl
    // Temporary
    NO_REGION = "Region: None",
    CALIFORNIA = "Region: California",
    ALABAMA = "Region: Alabama",
}

export default function DomainSelect({
    domains,
    selectedDomain,
    selectDomainHandler,
    disabledDomainIDs,
}: DomainSelectProps) {
    const [selectedFilters, setSelectedFilters] = useState<FilterTag[]>([]);

    const domainPredicate: ItemPredicate<DomainModel> = (
        query,
        domain,
        _index,
        exactMatch,
    ) => {
        if (
            selectedFilters.includes(FilterTag.ERRORS) &&
            !disabledDomainIDs.includes(domain.domainID)
        ) {
            return false;
        }

        if (
            selectedFilters.includes(FilterTag.NO_REGION) &&
            domain.region !== null
        ) {
            return false;
        }

        if (
            selectedFilters.includes(FilterTag.CALIFORNIA) &&
            domain.region !== DomainRegion.US_STATE_CA
        ) {
            return false;
        }

        if (
            selectedFilters.includes(FilterTag.ALABAMA) &&
            domain.region !== DomainRegion.US_STATE_AL
        ) {
            return false;
        }

        const normalizedName = domain.domainName.toLowerCase();

        const normalizedQuery = query.toLowerCase();
        const normalizedRegion = (domain.region ?? "no region").toLowerCase();

        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return (
                `${normalizedName}`.indexOf(normalizedQuery) >= 0 ||
                normalizedRegion.indexOf(normalizedQuery) >= 0
            );
        }
    };

    const domainRenderer: ItemRenderer<DomainModel> = (
        domain,
        { handleClick, handleFocus, modifiers, query },
    ) => {
        return (
            <MenuItem
                active={modifiers.active}
                text={domain.domainName}
                label={domain.homeLink}
                key={domain.domainName}
                roleStructure="listoption"
                onClick={handleClick}
                onFocus={handleFocus}
                disabled={modifiers.disabled}
                intent={
                    disabledDomainIDs.includes(domain.domainID)
                        ? Intent.DANGER
                        : Intent.NONE
                }
            />
        );
    };

    const handleTagAdd = (filter: FilterTag) => {
        setSelectedFilters((selectedFilters) => {
            // Check if the domain is already selected based on a unique identifier
            if (selectedFilters.some((f) => f === filter)) {
                return selectedFilters;
            }
            return [...selectedFilters, filter];
        });
    };

    const handleTagRemove = (tagValue: React.ReactNode, index: number) => {
        if (typeof tagValue === "string") {
            setSelectedFilters((selectedFilters) =>
                selectedFilters.filter((f) => f !== tagValue),
            );
        }
    };

    const filterTagRenderer: ItemRenderer<FilterTag> = (
        filter,
        { modifiers, handleClick },
    ) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
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

    return (
        <div className="my-5 flex w-full flex-row gap-x-5 p-3">
            <Select<DomainModel>
                items={domains}
                itemPredicate={domainPredicate}
                itemRenderer={domainRenderer}
                onItemSelect={selectDomainHandler}
                noResults={
                    <MenuItem
                        disabled={true}
                        text="No results"
                        roleStructure="listoption"
                    />
                }
                popoverProps={{ minimal: true }}
            >
                <Button
                    text={selectedDomain?.domainName ?? "Select Domain"}
                    icon="ip-address"
                    rightIcon="double-caret-vertical"
                />
            </Select>

            <MultiSelect<FilterTag>
                placeholder="Filters"
                items={Object.values(FilterTag)}
                itemRenderer={filterTagRenderer}
                tagRenderer={(filter) => filter}
                onItemSelect={handleTagAdd}
                selectedItems={selectedFilters}
                tagInputProps={{
                    onRemove: handleTagRemove,
                }}
                onClear={() => setSelectedFilters([])}
                resetOnSelect={true}
                noResults="No Filters"
                popoverProps={{ minimal: true }}
            />
        </div>
    );
}
