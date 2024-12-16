import { WebDataCategory } from "@/engine/scraping/categories";
import { Button, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";

// Props definition for SelectDataCategory now uses WebpageDataTargetCategory | undefined
type SelectDataCategoryProps = {
    category: Category;
    setCategory: (category: Category) => void;
};

type Category = WebDataCategory | undefined;

// Using the export default function syntax
export default function SelectDataCategory({
    category,
    setCategory,
}: SelectDataCategoryProps) {
    const renderCategoryItem: ItemRenderer<Category> = (
        item,
        { handleClick, modifiers },
    ) => (
        <MenuItem
            active={modifiers.active}
            key={item ?? "No Category"}
            onClick={handleClick}
            text={item ?? "No Category"}
        />
    );

    return (
        <Select
            items={[undefined as Category, ...Object.values(WebDataCategory)]}
            itemRenderer={renderCategoryItem}
            onItemSelect={(item: Category) => setCategory(item)}
            filterable={false}
            popoverProps={{ minimal: true }}
        >
            <Button
                text={category ?? "Select Data Category"}
                rightIcon="double-caret-vertical"
            />
        </Select>
    );
}
