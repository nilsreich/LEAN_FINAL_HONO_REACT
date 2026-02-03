import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { api } from "../lib/api";

export const PostDetailPage = () => {
	const { postId } = useParams({ strict: false }) as { postId: string };
	const { data: post, isLoading } = useQuery({
		queryKey: ["post", postId],
		queryFn: async () => {
			const res = await api.posts[":id"].$get({ param: { id: postId } });
			if (!res.ok) return null;
			return res.json();
		},
	});

	if (isLoading)
		return (
			<div className="flex justify-center py-20">
				<span className="loading loading-spinner loading-lg text-primary"></span>
			</div>
		);
	if (!post)
		return (
			<div className="alert alert-error shadow-sm rounded-2xl max-w-md mx-auto">
				<span>Post not found.</span>
			</div>
		);

	return (
		<div className="card bg-base-100 shadow-sm border border-base-200">
			<div className="card-body p-8 sm:p-12">
				<h2 className="card-title text-4xl font-black mb-6 leading-tight">{post.title}</h2>
				<div className="text-lg leading-relaxed opacity-80 whitespace-pre-wrap">{post.content}</div>
				<div className="divider opacity-20 mt-10"></div>
				<div className="flex justify-between items-center text-sm opacity-50 italic">
					<span>Published on {new Date(post.createdAt).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	);
};
