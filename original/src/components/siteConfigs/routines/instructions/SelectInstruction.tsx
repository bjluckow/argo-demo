"use client";
import { Dispatch, SetStateAction } from "react";
import { Button, MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, Select } from "@blueprintjs/select";
import {
    SUPPORTED_INSNS_INFO,
    PageInstructionSerial,
} from "@/engine/routines/instructions";

type SelectInstructionProps = {
    selectedInsnID: PageInstructionSerial | undefined;
    setSelectedInsnID: Dispatch<
        SetStateAction<PageInstructionSerial | undefined>
    >;
};

export default function SelectInstruction({
    selectedInsnID: selectedInsn,
    setSelectedInsnID: setSelectedInsn,
}: SelectInstructionProps) {
    const getInsnLabel = (insnSerial: PageInstructionSerial) =>
        `${insnSerial.insnType}:${insnSerial.insnSubtype}`;

    const handleItemSelect = (insnInfo: PageInstructionSerial) => {
        setSelectedInsn(insnInfo);
    };

    const filterInsn: ItemPredicate<PageInstructionSerial> = (
        query,
        insnSerial,
        _index,
        exactMatch,
    ) => {
        const normalizedInsn = getInsnLabel(insnSerial).toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedInsn === normalizedQuery;
        } else {
            return `${normalizedInsn}`.indexOf(normalizedQuery) >= 0;
        }
    };

    const renderInsn: ItemRenderer<PageInstructionSerial> = (
        insnSerial,
        { handleClick, handleFocus, modifiers, query },
    ) => {
        const insnLabel = getInsnLabel(insnSerial);
        return (
            <MenuItem
                active={modifiers.active}
                key={insnLabel}
                text={insnSerial.insnSubtype}
                label={insnSerial.insnType}
                onClick={handleClick}
                onFocus={handleFocus}
                roleStructure="listoption"
                disabled={modifiers.disabled}
            />
        );
    };

    return (
        <Select<PageInstructionSerial>
            items={SUPPORTED_INSNS_INFO}
            itemPredicate={filterInsn}
            itemRenderer={renderInsn}
            onItemSelect={handleItemSelect}
            noResults={
                <MenuItem
                    disabled={true}
                    text="No results."
                    roleStructure="listoption"
                />
            }
            popoverProps={{ minimal: true }}
        >
            <Button
                text={
                    selectedInsn
                        ? getInsnLabel(selectedInsn)
                        : "Select Instruction"
                }
                icon={
                    selectedInsn
                        ? selectedInsn.insnType === "action"
                            ? "generate"
                            : "locate"
                        : "multi-select"
                }
                rightIcon="double-caret-vertical"
            />
        </Select>
    );
}
