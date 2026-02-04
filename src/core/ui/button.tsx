import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: "primary" | "ghost" | "error";
	size?: "sm" | "md" | "lg" | "xs";
	loading?: boolean;
}

export function Button({
	children,
	variant = "primary",
	size = "md",
	loading,
	className = "",
	...props
}: ButtonProps) {
	const variants = {
		primary: "btn-primary",
		ghost: "btn-ghost",
		error: "btn-error",
	};

	const sizes = {
		xs: "btn-xs",
		sm: "btn-sm",
		md: "",
		lg: "btn-lg",
	};

	return (
		<button
			className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
			disabled={loading || props.disabled}
			{...props}
		>
			{loading && <span className="loading loading-spinner"></span>}
			{children}
		</button>
	);
}
