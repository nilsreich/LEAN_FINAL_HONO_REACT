import { createAuthClient } from "better-auth/react";
import { useState } from "react";
import { useI18nContext } from "../../i18n/i18n-react";

export const authClient = createAuthClient({
	baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

export function LoginForm() {
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
		<div className="flex justify-center items-center mt-20">
			<fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-xs border p-4">
				<legend className="fieldset-legend font-bold">
					{isLogin ? LL.LOGIN() : LL.REGISTER()}
				</legend>

				{!isLogin && (
					<>
						<label className="label">Name</label>
						<input
							type="text"
							className="input"
							placeholder="Your name"
							onChange={(e) => setName((e.target as HTMLInputElement).value)}
						/>
					</>
				)}

				<label className="label">Email</label>
				<input
					type="email"
					className="input"
					placeholder="Email"
					onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
				/>

				<label className="label">Password</label>
				<input
					type="password"
					className="input"
					placeholder="Password"
					onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
				/>

				<button onClick={handleAuth} className="btn btn-neutral mt-4">
					{isLogin ? LL.LOGIN() : LL.REGISTER()}
				</button>

				<button
					type="button"
					onClick={() => setIsLogin(!isLogin)}
					className="btn btn-link btn-sm mt-2 no-underline opacity-60 hover:opacity-100"
				>
					{isLogin ? LL.NEED_ACCOUNT() : LL.ALREADY_HAVE_ACCOUNT()}
				</button>
			</fieldset>
		</div>
	);
}
