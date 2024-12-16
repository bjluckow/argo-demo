import { SiteConfigModel } from "../models";

const fs = require("fs");
const path = require("path");

// Path to the JSON file
const jsonFilePath = path.join(__dirname, "./mockConfigs1.json");

// Read JSON file and convert data
fs.readFile(jsonFilePath, "utf8", (err: Error, data: any) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    try {
        // Parse the JSON data
        const jsonData = JSON.parse(data);

        // Assuming jsonData is an object that contains an array of site configs under a key
        if (!jsonData.siteConfigs) {
            console.error("Invalid JSON structure: missing 'siteConfigs' key");
            return;
        }

        // Map the JSON array to SiteConfigModel instances if needed
        const siteConfigs = jsonData.siteConfigs.map(
            (config: any) => config as SiteConfigModel,
        );

        // Optionally, wrap it into the specified type structure
        const typedData = { siteConfigs };

        // Output the typed data to verify it's correct
        console.log("Typed Data:", typedData);
    } catch (parseError) {
        console.error("Error parsing JSON data:", parseError);
    }
});
