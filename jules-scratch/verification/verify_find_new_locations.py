from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000/admin?isTest=true")

        time.sleep(5) # wait for the page to load

        # print(page.content()) # for debugging

        # Enter region name
        page.get_by_placeholder("Region Name (e.g., Rutherglen, VIC, Australia)").fill("Hunter Valley, NSW, Australia")

        # Click the find button
        page.get_by_role("button", name="Find New Locations").click()

        # Wait for the results to appear
        page.wait_for_selector("text=Potential New Wineries")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Screenshot taken successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
        print(page.content())
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
