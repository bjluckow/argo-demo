import { Logger } from "tslog";
import { appendFileSync } from "fs";
import { MAIN_LOGGER } from "@/engine/utils/mainLogger";

export const SCAN_LOGGER = new Logger({ name: `SCANSERVICE`, minLevel: 3 });

const filepath = `data/logs/scan_${Date.now().toString()}.txt`;

SCAN_LOGGER.attachTransport((logObj) => {
    appendFileSync(filepath, JSON.stringify(logObj) + "\n");
});

MAIN_LOGGER.attachTransport((logObj) => {
    appendFileSync(filepath, JSON.stringify(logObj) + "\n");
});
