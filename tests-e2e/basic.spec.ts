import { expect, test } from "@playwright/test";

test("has title and welcome message", async ({ page }) => {
	await page.goto("/");

	// Expect a title "to contain" a substring.
	await expect(page).toHaveTitle(/PostApp/);

	// Check for the welcome message
	const welcomeText = page.getByText("Welcome to PostApp");
	await expect(welcomeText).toBeVisible();
});

test("can navigate to login", async ({ page }) => {
	await page.goto("/");
	await page.click("text=Login");
	await expect(page).toHaveURL(/.*login/);
	await expect(page.getByText("Welcome Back")).toBeVisible();
});
