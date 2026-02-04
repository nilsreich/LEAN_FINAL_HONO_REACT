import type { auth } from "../../core/auth";

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
