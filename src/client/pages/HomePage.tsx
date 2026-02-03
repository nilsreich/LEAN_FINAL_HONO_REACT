import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";

export const HomePage = () => {
	const { data, isLoading } = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			const res = await api.api.posts.$get();
			if (!res.ok) throw new Error("Failed to fetch posts");
			return res.json();
		},
	});

	const posts = data?.posts;

	return (
		<div className="flex flex-col gap-8 pb-10">
			<div className="hero bg-base-200 rounded-3xl overflow-hidden shadow-inner">
				<div className="hero-content text-center py-12">
					<div className="max-w-md">
						<h1 className="text-4xl font-black">Welcome to PostApp</h1>
						<p className="py-4 opacity-70">
							A minimal place to share your thoughts. Join {data?.total ?? 0} others sharing their
							stories.
						</p>
						<Link to="/create" className="btn btn-primary rounded-xl">
							Start Writing
						</Link>
					</div>
				</div>
			</div>

			<section>
				<div className="flex justify-between items-end mb-6">
					<h3 className="text-2xl font-black">Featured Posts</h3>
					<span className="badge badge-outline opacity-50">{data?.total ?? 0} total</span>
				</div>

				{isLoading ? (
					<div className="flex justify-center py-20">
						<span className="loading loading-spinner loading-lg text-primary"></span>
					</div>
				) : (
					<div className="grid gap-4">
						{posts?.map((p: any) => (
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
						{posts?.length === 0 && (
							<div className="alert bg-base-200 border-none justify-center py-10 italic opacity-50">
								No posts yet. Be the first!
							</div>
						)}
					</div>
				)}
			</section>
		</div>
	);
};
