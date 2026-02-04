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
			<div className="flex flex-col min-h-screen bg-base-100">
				<Navbar />
				<main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
					<Outlet />
				</main>
				<footer className="footer sm:footer-horizontal footer-center p-10 bg-base-200 text-base-content mt-12">
					<aside>
						<p className="font-bold">
							PostApp Ltd. <br />
							Experimental Coding Project
						</p>
						<p>Copyright © 2026 - All right reserved</p>
					</aside>
				</footer>
			</div>
		</TypesafeI18n>
	);
}
