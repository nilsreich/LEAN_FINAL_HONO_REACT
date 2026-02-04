import { Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { useI18nContext } from "../i18n/i18n-react";
import { authClient } from "../modules/auth/auth.client";

export function Navbar() {
	const { data: session } = authClient.useSession();
	const { locale } = useI18nContext();

	return (
		<div className="navbar bg-base-100 shadow-sm border-b border-base-200 sticky top-0 z-50">
			<div className="container mx-auto">
				<div className="flex-1">
					<Link to="/" className="btn btn-ghost text-xl font-black">
						<span className="text-primary">Post</span>App
					</Link>
				</div>
				<div className="flex-none gap-2">
					<div className="dropdown dropdown-end">
						<div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
							<Languages size={20} />
						</div>
						<ul
							tabIndex={0}
							className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-32 p-2 shadow border border-base-200"
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

					<div className="dropdown dropdown-end">
						<div tabIndex={0} role="button" className="btn btn-ghost btn-circle text-primary">
							<div className="indicator">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									role="img"
									aria-label="Cart"
								>
									<title>Cart</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								<span className="badge badge-sm indicator-item">8</span>
							</div>
						</div>
						<div
							tabIndex={0}
							className="card card-compact dropdown-content bg-base-100 z-[1] mt-3 w-52 shadow border border-base-200"
						>
							<div className="card-body">
								<span className="text-lg font-bold">8 Items</span>
								<span className="text-info font-medium">Subtotal: $999</span>
								<div className="card-actions">
									<button className="btn btn-primary btn-block">View cart</button>
								</div>
							</div>
						</div>
					</div>

					{session ? (
						<div className="dropdown dropdown-end">
							<div
								tabIndex={0}
								role="button"
								className="btn btn-ghost btn-circle avatar ring-primary ring-offset-base-100 ring-offset-2 scale-90"
							>
								<div className="w-10 rounded-full">
									{session.user.image ? (
										<img alt="User Avatar" src={session.user.image} />
									) : (
										<div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center font-bold">
											{session.user.name[0]?.toUpperCase()}
										</div>
									)}
								</div>
							</div>
							<ul
								tabIndex={-1}
								className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow border border-base-200"
							>
								<li>
									<div className="px-4 py-2 font-bold opacity-50 text-xs uppercase tracking-tighter">
										{session.user.name}
									</div>
								</li>
								<div className="divider my-0"></div>
								<li>
									<Link to="/create">Profile</Link>
								</li>
								<li>
									<Link to="/">Settings</Link>
								</li>
								<li>
									<button onClick={() => authClient.signOut()} className="text-error">
										Logout
									</button>
								</li>
							</ul>
						</div>
					) : (
						<Link to="/login" className="btn btn-primary">
							Login
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
