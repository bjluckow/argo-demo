"use client";
import { Dispatch, SetStateAction } from "react";
import { DomainRegion } from "@/db/models";
import {
    ItemPredicate,
    ItemRenderer,
    Select,
} from "@blueprintjs/select";
import { MenuItem, Button } from "@blueprintjs/core";

type DomainRegionSelectProps = {
    selectedRegion: DomainRegion | null;
    setSelectedRegion: Dispatch<SetStateAction<DomainRegion | null>>;
};

const REGIONS = [null, ...Object.values(DomainRegion)];
const NO_REGION = "No Region";

export default function DomainRegionSelect({
    selectedRegion,
    setSelectedRegion,
}: DomainRegionSelectProps) {
    const filterRegion: ItemPredicate<DomainRegion | null> = (
        query,
        region,
        _index,
        exactMatch,
    ) => {
        const normalizedName = region ?? NO_REGION.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return `${normalizedName}`.indexOf(normalizedQuery) >= 0;
        }
    };

    const renderRegion: ItemRenderer<DomainRegion | null> = (
        region,
        { handleClick, handleFocus, modifiers, query },
    ) => {
        return (
            <MenuItem
                active={modifiers.active}
                text={region ?? NO_REGION}
                key={region ?? NO_REGION}
                roleStructure="listoption"
                onClick={handleClick}
                onFocus={handleFocus}
                disabled={modifiers.disabled}
            />
        );
    };

    return (
        <div>
            <Select<DomainRegion | null>
                items={REGIONS}
                itemPredicate={filterRegion}
                itemRenderer={renderRegion}
                onItemSelect={(v) => setSelectedRegion(v)}
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
                    text={selectedRegion ?? NO_REGION}
                    icon="globe"
                    rightIcon="double-caret-vertical"
                />
            </Select>
        </div>
    );
}
