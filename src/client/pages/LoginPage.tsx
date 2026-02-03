import { useState } from "react";
import { authClient } from "../auth/auth-client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export const LoginPage = () => {
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
		<Card className="max-w-md mx-auto" title={isLogin ? "Welcome Back" : "Join Us"}>
			<div className="flex flex-col gap-4">
				{!isLogin && (
					<Input
						label="Name"
						placeholder="Your name"
						onChange={(e) => setName((e.target as HTMLInputElement).value)}
					/>
				)}
				<Input
					label="Email"
					placeholder="email@example.com"
					onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
				/>
				<Input
					label="Password"
					type="password"
					placeholder="••••••••"
					onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
				/>

				<Button onClick={handleAuth} className="mt-2">
					{isLogin ? "Login" : "Register"}
				</Button>

				<div className="divider opacity-30 text-xs uppercase font-bold tracking-widest">OR</div>

				<button
					onClick={() => setIsLogin(!isLogin)}
					className="btn btn-ghost btn-sm no-animation opacity-50 hover:opacity-100"
				>
					{isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
				</button>
			</div>
		</Card>
	);
};
