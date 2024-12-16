// Scraper settings were not being properly overwritten by defaults
export function mergeSettings<T extends Record<string, any>>(
    defaults: T,
    overrides: Partial<T>,
): T {
    const merged: Record<string, any> = {};
    for (const key in defaults) {
        const defaultValue = defaults[key];
        const overrideValue = overrides[key];

        if (typeof defaultValue === "number") {
            merged[key] = getValidNumber(overrideValue, defaultValue);
        } else {
            merged[key] =
                overrideValue !== undefined ? overrideValue : defaultValue;
        }
    }
    return merged as T;
}

function getValidNumber(value: any, defaultValue: number): number {
    return typeof value === "number" && !isNaN(value) ? value : defaultValue;
}
