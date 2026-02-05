import type { Context, MiddlewareHandler } from "hono";
import pino from "pino";

// --- LEAN USER-AGENT PARSER ---
// Extract OS, Browser and Device Type using lightweight regex
const parseUA = (ua: string | undefined) => {
	if (!ua) return { os: "Other", browser: "Other", type: "Desktop" };

	let os = "Other";
	if (/Windows/i.test(ua)) os = "Windows";
	else if (/Macintosh|Mac OS X/i.test(ua)) os = "MacOS";
	else if (/Android/i.test(ua)) os = "Android";
	else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
	else if (/Linux/i.test(ua)) os = "Linux";

	let browser = "Other";
	if (/Firefox/i.test(ua)) browser = "Firefox";
	else if (/Edg/i.test(ua)) browser = "Edge";
	else if (/Chrome/i.test(ua)) browser = "Chrome";
	else if (/Safari/i.test(ua)) browser = "Safari";

	const type = /Mobile|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";

	return { os, browser, type };
};

const isProduction = process.env.NODE_ENV === "production";

// System Logger: Log directly to stdout (best for systemd/journalctl)
const systemLogger = pino({
	level: isProduction ? "info" : "debug",
	base: undefined,
	timestamp: pino.stdTimeFunctions.isoTime,
});

// Analytics Logger: Log to stdout in production, or file in dev
export const analyticsLogger = pino(
	{
		base: undefined,
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	isProduction
		? pino.destination(1)
		: pino.destination({
				dest: "./analytics.log",
				minLength: 0,
				sync: true,
			}),
);

// --- HELPERS ---

/**
 * Generates an anonymized 12-character hash from User IP + Daily Salt
 */
export const getUserHash = async (ip: string) => {
	const secret =
		process.env.LOG_SECRET || process.env.BETTER_AUTH_SECRET || "default-secret-change-me";
	const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	const data = `${date}-${ip}-${secret}`;

	const msgUint8 = new TextEncoder().encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

	return hashHex.slice(0, 12);
};

/**
 * Lean Analytics: Logs event with anonymized user data
 */
export const logEvent = async (c: Context, eventName: string, extra?: object) => {
	const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
	const uaString = c.req.header("user-agent");

	const userHash = await getUserHash(ip);
	const { os, browser, type } = parseUA(uaString);

	analyticsLogger.info({
		event: eventName,
		path: c.req.path,
		userHash,
		os,
		browser,
		type,
		...extra,
	});
};

/**
 * Global Middleware for basic system request logging
 */
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
	const start = performance.now();

	// Background analytics logging
	if (!c.req.path.startsWith("/admin") && !c.req.path.startsWith("/api/auth")) {
		logEvent(c, "page_view").catch(() => {});
	}

	await next();
	const duration = Math.round(performance.now() - start);

	// Log HTTP metrics directly to analytics.log for a single-file source of truth
	analyticsLogger.info({
		event: "http_request",
		path: c.req.path,
		status: c.res.status,
		duration: duration,
	});
};

export { systemLogger };
