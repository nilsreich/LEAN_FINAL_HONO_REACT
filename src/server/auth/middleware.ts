import type { Context, Next } from "hono";
import { auth } from "./auth";

type Variables = {
	user: typeof auth.$Infer.Session.user;
	session: typeof auth.$Infer.Session.session;
};

/**
 * AUTH GUARD MIDDLEWARE
 * Validates the session using Better Auth.
 * If no session exists, returns 401 Unauthorized.
 * Otherwise, stores the user and session in the Hono context.
 */
export const authGuard = async (c: Context<{ Variables: Variables }>, next: Next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);

	await next();
};
