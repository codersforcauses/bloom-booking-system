import test, { expect } from "@playwright/test";

import type {
  PaginatedRoomAvailabilityResponse,
  PaginatedRoomResponse,
} from "@/lib/api-types";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test.describe("Search Form - Name Search", () => {
  test("searches for room by name", async ({ page }) => {
    await page.route("**/rooms/**", async (route) => {
      const url = route.request().url();
      if (url.includes("name=Meeting")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            count: 1,
            results: [
              {
                id: 1,
                name: "Meeting Room A",
                img: "",
                location: { id: 1, name: "Floor 1" },
                capacity: 10,
                amenities: [{ id: 1, name: "Audio" }],
                start_datetime: "2024-01-01T00:00:00Z",
                end_datetime: "2024-12-31T23:59:59Z",
                recurrence_rule: "",
                is_active: true,
              },
            ],
            next: null,
            previous: null,
          } satisfies PaginatedRoomResponse),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/rooms/availability/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 1,
          results: [{ room_id: 1, availability: true }],
          next: null,
          previous: null,
        } satisfies PaginatedRoomAvailabilityResponse),
      });
    });

    await page.locator('input[name="name"]').fill("Meeting");
    await page.locator('button:has-text("Search")').click();

    await page.waitForTimeout(500);
  });
});

test.describe("Search Form - Capacity", () => {
  test("validates that minimum seats does not exceed maximum seats", async ({
    page,
  }) => {
    const minSeatsInput = page.locator('input[name="minSeats"]');
    const maxSeatsInput = page.locator('input[name="maxSeats"]');

    await minSeatsInput.fill("20");
    await maxSeatsInput.fill("10");
    await maxSeatsInput.blur();

    await page.waitForTimeout(500);

    const searchButton = page.locator('button:has-text("Search")');
    await expect(searchButton).toBeDisabled();
  });
});

test.describe("Search Form - Reset Functionality", () => {
  test("clears all form fields when Clear button is clicked", async ({
    page,
  }) => {
    await page.locator('input[name="name"]').fill("Test Room");
    await page.locator('input[name="minSeats"]').fill("5");
    await page.locator('input[name="maxSeats"]').fill("10");

    await page.locator('button:has-text("Clear")').click();

    await expect(page.locator('input[name="name"]')).toHaveValue("");
    await expect(page.locator('input[name="minSeats"]')).toHaveValue("");
    await expect(page.locator('input[name="maxSeats"]')).toHaveValue("");
  });
});

test.describe("Room Results Display", () => {
  test("displays 'No rooms found' when search returns no results", async ({
    page,
  }) => {
    await page.route("**/rooms/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 0,
          results: [],
          next: null,
          previous: null,
        } satisfies PaginatedRoomResponse),
      });
    });

    await page.route("**/rooms/availability/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 0,
          results: [],
          next: null,
          previous: null,
        } satisfies PaginatedRoomAvailabilityResponse),
      });
    });

    await page.locator('input[name="name"]').fill("NonexistentRoom");
    await page.locator('button:has-text("Search")').click();

    await page.waitForTimeout(500);

    await expect(
      page.locator("text=No rooms found. Please try again."),
    ).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("handles API errors gracefully", async ({ page }) => {
    await page.route("**/rooms/**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.route("**/rooms/availability/**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Search Form Submission", () => {
  test("submits search with all criteria", async ({ page }) => {
    let capturedParams: URLSearchParams | null = null;

    await page.route("**/rooms/**", async (route) => {
      const url = new URL(route.request().url());
      capturedParams = url.searchParams;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 0,
          results: [],
          next: null,
          previous: null,
        } satisfies PaginatedRoomResponse),
      });
    });

    await page.route("**/rooms/availability/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 0,
          results: [],
          next: null,
          previous: null,
        } satisfies PaginatedRoomAvailabilityResponse),
      });
    });

    await page.locator('input[name="name"]').fill("Executive Suite");
    await page.locator('input[name="minSeats"]').fill("8");
    await page.locator('input[name="maxSeats"]').fill("12");

    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(500);

    expect(capturedParams!.get("name")).toBe("Executive Suite");
    expect(capturedParams!.get("min_capacity")).toBe("8");
    expect(capturedParams!.get("max_capacity")).toBe("12");
  });
});
