import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "../client/lib/api.ts";
import { useI18nContext } from "../i18n/i18n-react";
import { createPostSchema } from "../shared/schemas.ts";

export const Route = createFileRoute("/create")({
	component: CreatePostPage,
});

function CreatePostPage() {
	const { LL } = useI18nContext();
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [error, setError] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();

	const createMutation = useMutation({
		mutationFn: async (params: { title: string; content: string }) => {
			const validation = createPostSchema(LL).safeParse(params);
			if (!validation.success) {
				throw new Error(validation.error.issues[0]?.message ?? "Validation failed");
			}

			const res = await api.posts.$post({ json: params });
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to create post");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			router.navigate({ to: "/" });
		},
		onError: (err) => {
			setError(err.message);
		},
	});

	return (
		<div className="card bg-base-100 shadow-sm border border-base-200 border-t-4 border-t-primary">
			<div className="card-body">
				<h2 className="card-title text-2xl font-bold">{LL.NEW_POST()}</h2>
				<div className="flex flex-col gap-6">
					{error && (
						<div className="alert alert-error">
							<span>{error}</span>
						</div>
					)}
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">{LL.TITLE()}</span>
						</div>
						<input
							className="input input-bordered focus:input-primary transition text-xl font-bold"
							value={title}
							onChange={(e) => {
								setTitle((e.target as HTMLInputElement).value);
								setError(null);
							}}
							placeholder={LL.ENTER_TITLE()}
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">{LL.CONTENT()}</span>
						</div>
						<textarea
							className="textarea textarea-bordered h-48 focus:textarea-primary transition"
							value={content}
							onChange={(e) => {
								setContent((e.target as HTMLTextAreaElement).value);
								setError(null);
							}}
							placeholder={LL.STORY_PLACEHOLDER()}
						/>
					</label>
					<div className="card-actions justify-end">
						<button
							onClick={() => createMutation.mutate({ title, content })}
							disabled={createMutation.isPending}
							className="btn btn-primary w-full sm:w-auto min-w-[150px]"
						>
							{createMutation.isPending && <span className="loading loading-spinner"></span>}
							{createMutation.isPending ? "..." : LL.PUBLISH()}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
