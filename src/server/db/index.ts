import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// 1. LibSQL Client erstellen (Lokal auf dem VPS)
// LibSQL aktiviert WAL-Mode automatisch für lokale Dateien!
const client = createClient({
	url: "file:sqlite.db",
});

// 2. Drizzle mit dem libSQL-Client initialisieren
export const db = drizzle(client, { schema });
