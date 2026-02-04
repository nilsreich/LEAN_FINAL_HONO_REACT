import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/core/db.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "file:sqlite.db",
	},
});
