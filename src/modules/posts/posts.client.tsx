import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "../../core/api.client";
import { useI18nContext } from "../../i18n/i18n-react";
import { createPostSchema } from "./posts.shared";

export function PostList() {
	const { LL } = useI18nContext();
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
		queryKey: ["posts"],
		queryFn: async ({ pageParam = 0 }) => {
			const res = await api.posts.$get({
				query: {
					limit: "5",
					offset: pageParam.toString(),
				},
			});
			if (!res.ok) throw new Error("Failed to fetch posts");
			return res.json();
		},
		getNextPageParam: (lastPage) => {
			const nextOffset = lastPage.offset + lastPage.posts.length;
			return nextOffset < lastPage.total ? nextOffset : undefined;
		},
		initialPageParam: 0,
	});

	const posts = data?.pages.flatMap((page) => page.posts) ?? [];
	const total = data?.pages[0]?.total ?? 0;

	return (
		<div className="flex flex-col gap-12 pb-20">
			<div className="hero bg-base-200 rounded-box p-4 sm:p-12 overflow-hidden shadow-sm border border-base-300">
				<div className="hero-content text-center">
					<div className="max-w-md">
						<h1 className="text-5xl font-black">{LL.WELCOME()}</h1>
						<p className="py-6 text-lg opacity-80">
							A minimal place to share your thoughts. Join {total} others sharing their stories.
						</p>
						<Link to="/create" className="btn btn-primary btn-lg">
							{LL.CREATE_POST()}
						</Link>
					</div>
				</div>
			</div>

			<section>
				<div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
					<h3 className="text-3xl font-bold">{LL.HOME()}</h3>
					<div className="stats shadow-sm border border-base-200 bg-base-100">
						<div className="stat py-2 px-6">
							<div className="stat-title text-xs uppercase font-bold tracking-widest">{LL.TOTAL_POSTS?.() || "Posts"}</div>
							<div className="stat-value text-2xl text-primary">{total}</div>
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center py-32">
						<span className="loading loading-dots loading-lg text-primary"></span>
					</div>
				) : (
					<div className="grid gap-6">
						{posts.map((p: any) => (
							<Link
								key={p.id}
								to="/posts/$postId"
								params={{ postId: p.id }}
								className="card bg-base-100 border border-base-200 hover:border-primary hover:shadow-md transition-all group"
							>
								<div className="card-body gap-4">
									<h4 className="card-title text-2xl font-bold group-hover:text-primary transition-colors">
										{p.title}
									</h4>
									<p className="opacity-70 line-clamp-3 leading-relaxed">{p.content}</p>
									<div className="card-actions justify-between items-center mt-4">
										<div className="badge badge-outline opacity-40">
											{new Date(p.createdAt).toLocaleDateString()}
										</div>
										<div className="btn btn-ghost btn-sm group-hover:btn-primary">Read More</div>
									</div>
								</div>
							</Link>
						))}

						{posts.length === 0 && (
							<div className="alert bg-base-200 border-none justify-center py-16 italic opacity-50">
								{LL.NO_POSTS()}
							</div>
						)}

						{hasNextPage && (
							<div className="flex justify-center mt-12">
								<button
									type="button"
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									className="btn btn-neutral btn-wide"
								>
									{isFetchingNextPage ? (
										<span className="loading loading-spinner"></span>
									) : (
										LL.LOAD_MORE()
									)}
								</button>
							</div>
						)}
					</div>
				)}
			</section>
		</div>
	);
}

export function CreatePostForm() {
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
		<div className="max-w-2xl mx-auto">
			<fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-6 sm:p-10">
				<legend className="fieldset-legend text-3xl font-black px-4">{LL.NEW_POST()}</legend>

				{error && (
					<div className="alert alert-error mb-6">
						<span>{error}</span>
					</div>
				)}

				<label className="label font-bold text-lg">{LL.TITLE()}</label>
				<input
					className="input w-full bg-base-100 border-base-300 focus:border-primary text-xl font-bold py-8"
					value={title}
					onChange={(e) => {
						setTitle((e.target as HTMLInputElement).value);
						setError(null);
					}}
					placeholder={LL.ENTER_TITLE()}
				/>

				<label className="label font-bold text-lg mt-4">{LL.CONTENT()}</label>
				<textarea
					className="textarea w-full bg-base-100 border-base-300 focus:border-primary h-64 text-lg p-4"
					value={content}
					onChange={(e) => {
						setContent((e.target as HTMLTextAreaElement).value);
						setError(null);
					}}
					placeholder={LL.STORY_PLACEHOLDER()}
				/>

				<div className="mt-8 flex justify-end">
					<button
						onClick={() => createMutation.mutate({ title, content })}
						disabled={createMutation.isPending}
						className="btn btn-primary btn-lg px-12"
					>
						{createMutation.isPending && <span className="loading loading-spinner"></span>}
						{createMutation.isPending ? "..." : LL.PUBLISH()}
					</button>
				</div>
			</fieldset>
		</div>
	);
}

export function PostDetail({ postId }: { postId: string }) {
	const { LL } = useI18nContext();
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
		<article className="max-w-3xl mx-auto">
			<div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden mt-8">
				<div className="card-body p-8 sm:p-16 gap-8">
					<header>
						<div className="flex items-center gap-2 mb-4 opacity-50">
							<div className="badge badge-primary badge-outline">Article</div>
							<span className="text-sm">
								{LL.PUBLISHED_ON({ date: new Date(post.createdAt).toLocaleDateString() })}
							</span>
						</div>
						<h1 className="card-title text-4xl sm:text-5xl font-black leading-tight mb-2">
							{post.title}
						</h1>
						<div className="divider opacity-10"></div>
					</header>

					<section className="text-xl leading-relaxed opacity-90 whitespace-pre-wrap font-serif">
						{post.content}
					</section>

					<footer className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-base-200 rounded-2xl border border-base-300">
						<div className="flex items-center gap-4">
							<div className="avatar placeholder">
								<div className="bg-neutral text-neutral-content rounded-full w-12">
									<span className="text-xl">A</span>
								</div>
							</div>
							<div>
								<div className="font-bold">PostApp Author</div>
								<div className="text-xs opacity-50">Content Creator</div>
							</div>
						</div>
						<Link to="/" className="btn btn-ghost btn-sm">
							← Back to Feed
						</Link>
					</footer>
				</div>
			</div>
		</article>
	);
}
