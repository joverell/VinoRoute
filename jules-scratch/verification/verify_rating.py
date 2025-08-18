from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")

    try:
        # Wait for the winery cards to be visible
        page.wait_for_selector('.flex.flex-col.gap-4.mt-4', timeout=10000)

        # Click on the first winery card to open the detail view
        page.query_selector('.flex.flex-col.gap-4.mt-4 > div:first-child').click()

        # Wait for the detail view to be visible
        page.wait_for_selector('.p-4.bg-white.rounded-lg.shadow-md')

        page.screenshot(path="jules-scratch/verification/winery_detail.png")
    except Exception as e:
        print(e)
        print(page.content())
        page.screenshot(path="jules-scratch/verification/error.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
