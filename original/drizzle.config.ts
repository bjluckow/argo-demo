import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/schema.ts",
    out: "./data/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: process.env.DB_PATH ?? "./data/argo.db",
    },
} satisfies Config;
