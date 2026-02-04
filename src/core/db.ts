import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as authSchema from "../modules/auth/auth.db";
import * as postsSchema from "../modules/posts/posts.db";

export const schema = {
	...authSchema,
	...postsSchema,
};

const client = createClient({
	url: "file:sqlite.db",
});

export const db = drizzle(client, { schema });
