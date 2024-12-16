import { Logger } from "tslog";

export const BROWSER_LOGGER = (name: string) =>
    new Logger({ name: `BROWSER [${name}]` });
