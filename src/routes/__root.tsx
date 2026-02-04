import { createRootRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "../client/Navbar";
import TypesafeI18n from "../i18n/i18n-react.tsx";
import type { Locales } from "../i18n/i18n-types";
import { loadAllLocales } from "../i18n/i18n-util.sync.ts";

// Load all locales for i18n
loadAllLocales();

export const Route = createRootRoute({
	validateSearch: z.object({
		lang: z.enum(["en", "de"]).optional(),
	}),
	component: RootComponent,
});

function RootComponent() {
	const { lang } = Route.useSearch();
	const locale = (lang || "en") as Locales;

	return (
		<TypesafeI18n locale={locale}>
			<div className="flex flex-col min-h-screen">
				<Navbar />
				<main className="flex-grow w-full max-w-2xl mx-auto px-4 py-6">
					<Outlet />
				</main>
				<footer className="footer footer-center p-10 bg-base-200 text-base-content rounded opacity-30">
					<aside>
						<p>Copyright © 2026 - All right reserved by PostApp</p>
					</aside>
				</footer>
			</div>
		</TypesafeI18n>
	);
}
