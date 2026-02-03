import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import * as schema from "../db/schema";

/**
 * BETTER-AUTH SERVER CONFIG
 */
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: schema,
	}),
	// In Codespaces, Better-Auth needs to know its public URL
	// If you see 500 errors, make sure BETTER_AUTH_URL is set in .env
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	trustedOrigins: [
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:5175",
		"http://localhost:3000",
		"http://localhost:4173",
		"http://localhost:4174",
		"http://localhost:4175",
	],
	emailAndPassword: {
		enabled: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
});
