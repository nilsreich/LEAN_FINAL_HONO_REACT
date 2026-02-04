import { Link } from "@tanstack/react-router";
import { Home, Languages, LogIn, LogOut, PlusCircle } from "lucide-react";
import { useI18nContext } from "../i18n/i18n-react";
import { authClient } from "./auth/auth-client";

export function Navbar() {
	const { data: session } = authClient.useSession();
	const { LL, locale } = useI18nContext();

	return (
		<nav className="navbar bg-base-100 shadow-sm rounded-box max-w-2xl mx-auto my-4 px-4 sticky top-4 z-50">
			<div className="flex-1">
				<Link to="/" className="btn btn-ghost text-xl font-black text-primary gap-2">
					<Home size={24} />
					<span className="hidden sm:inline">PostApp</span>
				</Link>
			</div>
			<div className="flex-none gap-2">
				<div className="dropdown dropdown-end">
					<div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
						<Languages size={20} />
					</div>
					<ul
						tabIndex={0}
						className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-32 border border-base-200"
					>
						<li>
							<Link
								to="."
								search={(prev: any) => ({ ...prev, lang: "en" })}
								className={locale === "en" ? "active" : ""}
							>
								English
							</Link>
						</li>
						<li>
							<Link
								to="."
								search={(prev: any) => ({ ...prev, lang: "de" })}
								className={locale === "de" ? "active" : ""}
							>
								Deutsch
							</Link>
						</li>
					</ul>
				</div>

				{session ? (
					<div className="flex items-center gap-2">
						<Link
							to="/create"
							className="btn btn-ghost btn-circle text-primary"
							title={LL.CREATE_POST()}
						>
							<PlusCircle size={24} />
						</Link>
						<div className="dropdown dropdown-end">
							<div
								tabIndex={0}
								role="button"
								className="btn btn-ghost btn-circle avatar placeholder"
							>
								<div className="bg-neutral text-neutral-content rounded-full w-10">
									<span>{session.user.name[0]?.toUpperCase()}</span>
								</div>
							</div>
							<ul
								tabIndex={0}
								className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-200"
							>
								<li>
									<span className="font-bold opacity-50 px-3 py-2 block">{session.user.name}</span>
								</li>
								<li>
									<button onClick={() => authClient.signOut()} className="text-error">
										<LogOut size={16} /> {LL.LOGOUT()}
									</button>
								</li>
							</ul>
						</div>
					</div>
				) : (
					<Link to="/login" className="btn btn-primary btn-sm rounded-xl">
						<LogIn size={18} /> {LL.LOGIN()}
					</Link>
				)}
			</div>
		</nav>
	);
}
