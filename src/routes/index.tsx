import { createFileRoute } from "@tanstack/react-router";
import { PostList } from "../modules/posts/posts.client";

export const Route = createFileRoute("/")({
	component: PostList,
});
