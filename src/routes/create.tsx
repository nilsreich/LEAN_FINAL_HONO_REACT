import { createFileRoute } from "@tanstack/react-router";
import { CreatePostForm } from "../modules/posts/posts.client";

export const Route = createFileRoute("/create")({
	component: CreatePostForm,
});
