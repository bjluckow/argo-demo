"use client";
import { SitePath } from "@/engine/sites/paths";
import { MenuItem, Button } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, Select } from "@blueprintjs/select";

type SitePathSelectProps = {
    sitePaths: SitePath[];
    selectedPath: SitePath | undefined;
    setSelectedPath: (path: SitePath) => void;
};

export default function SitePathSelect({
    sitePaths,
    selectedPath,
    setSelectedPath,
}: SitePathSelectProps) {
    const filterSitePath: ItemPredicate<SitePath> = (
        query,
        sitePath,
        _index,
        exactMatch,
    ) => {
        const normalizedName = sitePath.label.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return `${normalizedName}`.indexOf(normalizedQuery) >= 0;
        }
    };

    const renderSitePath: ItemRenderer<SitePath> = (
        sitePath,
        { handleClick, handleFocus, modifiers, query },
    ) => {
        return (
            <MenuItem
                active={modifiers.active}
                text={sitePath.label}
                // label={sitePath.pattern}
                key={sitePath.label}
                roleStructure="listoption"
                onClick={handleClick}
                onFocus={handleFocus}
                disabled={modifiers.disabled}
            />
        );
    };

    return (
        <div>
            <Select<SitePath>
                items={sitePaths}
                itemPredicate={filterSitePath}
                itemRenderer={renderSitePath}
                onItemSelect={setSelectedPath}
                noResults={
                    <MenuItem
                        disabled={true}
                        text="No results"
                        roleStructure="listoption"
                    />
                }
            >
                <Button
                    text={selectedPath?.label ?? "Select Site Path"}
                    icon="path"
                    rightIcon="double-caret-vertical"
                />
            </Select>
        </div>
    );
}
