import type { TranslationFunctions } from "../i18n/i18n-types";
import type { auth } from "./auth/auth";

export type Session = typeof auth.$Infer.Session;

export type Variables = {
	user: Session["user"] | null;
	session: Session["session"] | null;
	LL: TranslationFunctions;
};
