import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";

export const CreatePostPage = () => {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const queryClient = useQueryClient();
	const router = useRouter();

	const createMutation = useMutation({
		mutationFn: async (params: { title: string; content: string }) => {
			const res = await api.posts.$post({ json: params });
			if (!res.ok) throw new Error("Failed to create post");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			router.navigate({ to: "/" });
		},
	});

	return (
		<Card title="New Post" className="border-t-4 border-t-primary">
			<div className="flex flex-col gap-6">
				<Input
					label="Title"
					value={title}
					onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
					placeholder="Enter a catchy title..."
					className="text-xl font-bold"
				/>
				<Input
					isTextArea
					label="Content"
					value={content}
					onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
					placeholder="Share your story..."
				/>
				<div className="card-actions justify-end">
					<Button
						onClick={() => createMutation.mutate({ title, content })}
						disabled={createMutation.isPending || !title || !content}
						className="w-full sm:w-auto min-w-[150px]"
					>
						{createMutation.isPending && <span className="loading loading-spinner"></span>}
						{createMutation.isPending ? "Sharing..." : "Publish Post"}
					</Button>
				</div>
			</div>
		</Card>
	);
};
