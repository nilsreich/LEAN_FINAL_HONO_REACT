import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "../client/lib/api.ts";
import { useI18nContext } from "../i18n/i18n-react";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
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
		<div className="flex flex-col gap-8 pb-10">
			<div className="hero bg-base-200 rounded-3xl overflow-hidden shadow-inner">
				<div className="hero-content text-center py-12">
					<div className="max-w-md">
						<h1 className="text-4xl font-black">{LL.WELCOME()}</h1>
						<p className="py-4 opacity-70">
							A minimal place to share your thoughts. Join {total} others sharing their stories.
						</p>
						<Link to="/create" className="btn btn-primary rounded-xl">
							{LL.CREATE_POST()}
						</Link>
					</div>
				</div>
			</div>

			<section>
				<div className="flex justify-between items-end mb-6">
					<h3 className="text-2xl font-black">{LL.HOME()}</h3>
					<span className="badge badge-outline opacity-50">{total} total</span>
				</div>

				{isLoading ? (
					<div className="flex justify-center py-20">
						<span className="loading loading-spinner loading-lg text-primary"></span>
					</div>
				) : (
					<div className="grid gap-4">
						{posts.map((p: any) => (
							<Link
								key={p.id}
								to="/posts/$postId"
								params={{ postId: p.id }}
								className="card bg-base-100 shadow-sm border border-base-200 hover:border-primary transition group"
							>
								<div className="card-body p-6">
									<h4 className="card-title font-bold group-hover:text-primary transition">
										{p.title}
									</h4>
									<p className="opacity-60 text-sm line-clamp-2">{p.content}</p>
									<div className="card-actions justify-end mt-2">
										<div className="badge badge-ghost badge-sm opacity-50">
											{new Date(p.createdAt).toLocaleDateString()}
										</div>
									</div>
								</div>
							</Link>
						))}

						{posts.length === 0 && (
							<div className="alert bg-base-200 border-none justify-center py-10 italic opacity-50">
								{LL.NO_POSTS()}
							</div>
						)}

						{hasNextPage && (
							<div className="flex justify-center mt-6">
								<button
									type="button"
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									className="btn btn-ghost btn-sm opacity-70 hover:opacity-100"
								>
									{isFetchingNextPage ? (
										<span className="loading loading-spinner loading-xs"></span>
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
