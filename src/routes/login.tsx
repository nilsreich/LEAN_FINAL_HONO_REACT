import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../modules/auth/auth.client";

export const Route = createFileRoute("/login")({
	component: LoginForm,
});
