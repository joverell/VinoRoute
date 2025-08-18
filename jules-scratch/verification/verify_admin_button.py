import re
from playwright.sync_api import Page, expect

def test_admin_button_visibility(page: Page):
    """
    This test verifies that the admin button is not visible to non-admin users.
    """
    # 1. Arrange: Go to the application's homepage.
    page.goto("http://localhost:3000")

    # 2. Assert: Check that the "Login with Google to Save" button is visible.
    # This confirms that the user is not logged in.
    login_button = page.get_by_role("button", name="Login with Google to Save")
    expect(login_button).to_be_visible()

    # 3. Assert: Check that the admin button is not visible.
    admin_button = page.get_by_role("link", name="Admin")
    expect(admin_button).not_to_be_visible()

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")
