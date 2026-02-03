import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
	label?: string;
	isTextArea?: boolean;
}

export const Input = ({ label, isTextArea, className = "", ...props }: InputProps) => {
	return (
		<label className="form-control w-full">
			{label && (
				<div className="label">
					<span className="label-text font-semibold">{label}</span>
				</div>
			)}
			{isTextArea ? (
				<textarea
					className={`textarea textarea-bordered h-48 focus:textarea-primary transition ${className}`}
					{...(props as any)}
				/>
			) : (
				<input
					className={`input input-bordered focus:input-primary transition ${className}`}
					{...(props as any)}
				/>
			)}
		</label>
	);
};
