import type { BaseTranslation } from "../i18n-types.js";

const en = {
	WELCOME: "Welcome to PostApp",
	HOME: "Home",
	LOGIN: "Login",
	REGISTER: "Register",
	CREATE_POST: "Create Post",
	LOGOUT: "Logout",
	PUBLISH: "Publish Post",
	CONTENT: "Content",
	TITLE: "Title",
	LOAD_MORE: "Load more posts",
	NO_POSTS: "No posts yet. Be the first!",
	LOGIN_WELCOME: "Welcome Back",
	JOIN_US: "Join Us",
	NEW_POST: "New Post",
	ENTER_TITLE: "Enter a catchy title...",
	STORY_PLACEHOLDER: "Share your story...",
	PUBLISHED_ON: "Published on {date}",
	NEED_ACCOUNT: "Need an account? Sign up",
	ALREADY_HAVE_ACCOUNT: "Already have an account? Login",
	VALIDATION_TITLE_REQUIRED: "Title is required",
	VALIDATION_TITLE_TOO_LONG: "Title too long (max 100 characters)",
	VALIDATION_CONTENT_REQUIRED: "Content is required",
	ERROR_POST_NOT_FOUND: "Post not found",
	ERROR_UNAUTHORIZED: "Unauthorized",
} satisfies BaseTranslation;

export default en;
