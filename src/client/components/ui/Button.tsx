import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "accent" | "ghost" | "error" | "outline";
	size?: "xs" | "sm" | "md" | "lg";
}

export const Button = ({
	variant = "primary",
	size = "md",
	className = "",
	...props
}: ButtonProps) => {
	const variantClasses = {
		primary: "btn-primary",
		secondary: "btn-secondary",
		accent: "btn-accent",
		ghost: "btn-ghost",
		error: "btn-error",
		outline: "btn-outline",
	};

	const sizeClasses = {
		xs: "btn-xs",
		sm: "btn-sm",
		md: "",
		lg: "btn-lg",
	};

	return (
		<button
			className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
			{...props}
		/>
	);
};
