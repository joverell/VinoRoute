import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for the sidebar to be ready
        expect(page.get_by_text("Plan Your Tour")).to_be_visible(timeout=60000)

        # Find the first winery card in the list
        card_container = page.locator("div.flex.flex-col.gap-4.mt-4")
        first_winery_card = card_container.locator("div.p-4.bg-white.rounded-lg.shadow-md").first

        winery_name_element = first_winery_card.locator("h3")
        expect(winery_name_element).to_be_visible()
        winery_name = winery_name_element.inner_text()
        print(f"Found winery: {winery_name}")

        # Click the card to navigate to detail view
        print("Clicking card to see detail view")
        first_winery_card.click()

        # Check that the detail view is shown
        expect(page.get_by_text(winery_name)).to_be_visible()
        expect(page.locator("button:has-text('Back to list')")).to_be_visible()

        print("Taking detail_view screenshot")
        page.screenshot(path="jules-scratch/verification/detail_view.png")

        # Click "Back to list"
        print("Clicking 'Back to list'")
        page.locator("button:has-text('Back to list')").click()

        # Check that the list view is shown again
        expect(page.get_by_text("Available Locations")).to_be_visible()

        print("Taking list_view screenshot")
        page.screenshot(path="jules-scratch/verification/list_view.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
        raise e
    finally:
        browser.close()


with sync_playwright() as playwright:
    run(playwright)
