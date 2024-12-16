import { Dispatch, SetStateAction } from "react";
import { DomainModel } from "@/db/models";
import { Intent, MenuItem,  } from "@blueprintjs/core";
import { MultiSelect, ItemRenderer, ItemPredicate } from "@blueprintjs/select";

type DomainMultiselectProps = {
    domains: DomainModel[];
    selectedDomains: DomainModel[];
    setSelectedDomains: Dispatch<SetStateAction<DomainModel[]>>;
    disabledDomainIDs: number[];
};

export default function DomainMultiselect({
    domains,
    selectedDomains,
    setSelectedDomains,
    disabledDomainIDs,
}: DomainMultiselectProps) {
    const handleDomainSelect = (domain: DomainModel) => {
        setSelectedDomains((currentSelection) => {
            // Check if the domain is already selected based on a unique identifier
            if (
                currentSelection.some((d) => d.domainName === domain.domainName)
            ) {
                return currentSelection;
            }
            return [...currentSelection, domain];
        });
    };

    const handleTagRemove = (tagValue: React.ReactNode, index: number) => {
        if (typeof tagValue === "string") {
            setSelectedDomains((currentSelection) =>
                currentSelection.filter(
                    (domain) => domain.domainName !== tagValue,
                ),
            );
        }
    };

    const renderDomain: ItemRenderer<DomainModel> = (
        domain,
        { modifiers, handleClick },
    ) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem
                key={domain.domainName} // Ensure key is unique
                roleStructure="listoption"
                onClick={handleClick}
                text={domain.domainName}
                shouldDismissPopover={true}
                intent={
                    disabledDomainIDs.includes(domain.domainID)
                        ? Intent.DANGER
                        : Intent.NONE
                }
            />
        );
    };

    const filterDomain: ItemPredicate<DomainModel> = (
        query,
        domain,
        _index,
        exactMatch,
    ) => {
        const normalizedQuery = query.toLowerCase();

        const normalizedName = domain.domainName.toLowerCase();
        const normalizedRegion = (domain.region ?? "no region").toLowerCase();

        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return (
                normalizedName.indexOf(normalizedQuery) >= 0 ||
                normalizedRegion.indexOf(normalizedQuery) >= 0
            );
        }
    };

    return (
        <MultiSelect<DomainModel>
            placeholder="Select Domains"
            items={domains.filter((d) => !selectedDomains.includes(d))}
            itemRenderer={renderDomain}
            itemPredicate={filterDomain}
            tagRenderer={(domain) => domain.domainName}
            onItemSelect={handleDomainSelect}
            selectedItems={selectedDomains}
            tagInputProps={{
                onRemove: handleTagRemove,
            }}
            onClear={() => setSelectedDomains([])}
            resetOnSelect={true}
            noResults="No Domains"
            popoverProps={{ minimal: true }}
        />
    );
}
