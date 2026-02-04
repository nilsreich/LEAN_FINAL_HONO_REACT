import { createFileRoute } from "@tanstack/react-router";
import { PostDetail } from "../modules/posts/posts.client";

export const Route = createFileRoute("/posts/$postId")({
	component: PostDetailPage,
});

function PostDetailPage() {
	const { postId } = Route.useParams();
	return <PostDetail postId={postId} />;
}
