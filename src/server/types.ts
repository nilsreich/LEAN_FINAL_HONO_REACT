import type { auth } from "./auth/auth";

export type Session = typeof auth.$Infer.Session;

export type Variables = {
	user: Session["user"];
	session: Session["session"];
};
