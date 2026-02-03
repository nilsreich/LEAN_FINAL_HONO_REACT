import type React from "react";

export const Card = ({
	children,
	className = "",
	title,
}: {
	children: React.ReactNode;
	className?: string;
	title?: string;
}) => {
	return (
		<div className={`card bg-base-100 shadow-sm border border-base-200 ${className}`}>
			<div className="card-body">
				{title && <h2 className="card-title text-2xl font-bold">{title}</h2>}
				{children}
			</div>
		</div>
	);
};
