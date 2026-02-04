import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../client/auth/auth-client.ts";
import { useI18nContext } from "../i18n/i18n-react";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const { LL } = useI18nContext();
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");

	const handleAuth = async () => {
		if (isLogin) {
			await authClient.signIn.email({ email, password, callbackURL: "/" });
		} else {
			await authClient.signUp.email({
				email,
				password,
				name,
				callbackURL: "/",
			});
		}
	};

	return (
		<div className="card bg-base-100 shadow-sm border border-base-200 max-w-md mx-auto">
			<div className="card-body">
				<h2 className="card-title text-2xl font-bold">
					{isLogin ? LL.LOGIN_WELCOME() : LL.JOIN_US()}
				</h2>
				<div className="flex flex-col gap-4">
					{!isLogin && (
						<label className="form-control w-full">
							<div className="label">
								<span className="label-text font-semibold">Name</span>
							</div>
							<input
								className="input input-bordered focus:input-primary transition"
								placeholder="Your name"
								onChange={(e) => setName((e.target as HTMLInputElement).value)}
							/>
						</label>
					)}
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">Email</span>
						</div>
						<input
							className="input input-bordered focus:input-primary transition"
							placeholder="email@example.com"
							onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">Password</span>
						</div>
						<input
							type="password"
							className="input input-bordered focus:input-primary transition"
							placeholder="••••••••"
							onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
						/>
					</label>

					<button onClick={handleAuth} className="btn btn-primary mt-2">
						{isLogin ? LL.LOGIN() : LL.REGISTER()}
					</button>

					<div className="divider opacity-30 text-xs uppercase font-bold tracking-widest">OR</div>

					<button
						type="button"
						onClick={() => setIsLogin(!isLogin)}
						className="btn btn-ghost btn-sm no-animation opacity-50 hover:opacity-100"
					>
						{isLogin ? LL.NEED_ACCOUNT() : LL.ALREADY_HAVE_ACCOUNT()}
					</button>
				</div>
			</div>
		</div>
	);
}
