import type { Context, Next } from "hono";
import { auth } from "../../core/auth";
import type { Session } from "./auth.shared";

export type AuthVariables = {
	user: Session["user"] | null;
	session: Session["session"] | null;
};

export const authGuard = async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		const LL = (c as any).get("LL");
		return c.json({ error: LL ? LL.ERROR_UNAUTHORIZED() : "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);

	await next();
};

export const authHandler = (c: Context) => auth.handler(c.req.raw);
