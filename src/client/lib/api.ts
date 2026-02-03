import { hc } from "hono/client";
import type { AppType } from "../../server/index";

/**
 * HONO RPC CLIENT
 * Provides end-to-end typesafety between backend and frontend.
 */
export const api = hc<AppType>("/");
