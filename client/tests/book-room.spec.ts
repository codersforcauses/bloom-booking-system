import test, { expect } from "@playwright/test";

import type {
  BookingResponse,
  CreateBookingRequest,
  RoomResponse,
} from "@/lib/api-types";

test.describe("Book Room Page - Page Loading", () => {
  test("loads book room page with valid room ID", async ({ page }) => {
    await page.route("**/rooms/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Conference Room A",
          img: "https://example.com/room.jpg",
          location: { id: 1, name: "Floor 1" },
          capacity: 10,
          amenities: [
            { id: 1, name: "Projector" },
            { id: 2, name: "Whiteboard" },
          ],
          start_datetime: "2024-01-01T00:00:00Z",
          end_datetime: "2024-12-31T23:59:59Z",
          recurrence_rule: "",
          is_active: true,
        } satisfies RoomResponse),
      });
    });

    await page.goto("http://localhost:3000/book-room/1");

    await page.waitForLoadState("networkidle");

    // Check that page loaded successfully - either h1 or form should be visible
    const h1 = page.locator("h1");
    const form = page.locator("form");

    const h1Count = await h1.count();
    const formCount = await form.count();

    expect(h1Count + formCount).toBeGreaterThan(0);
  });

  test("shows error for invalid room ID", async ({ page }) => {
    await page.route("**/rooms/999", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Room not found" }),
      });
    });

    await page.goto("http://localhost:3000/book-room/999");

    // Wait for the error dialog to appear
    const errorTitle = page.getByText(/an error has occurred/i);
    await expect(errorTitle).toBeVisible({ timeout: 15000 });

    // Should have an Ok button
    const okButton = page.getByRole("button", { name: /ok/i });
    await expect(okButton).toBeVisible();

    // Click Ok and verify navigation to home page
    await okButton.click();
    await page.waitForURL("http://localhost:3000/", { timeout: 5000 });

    expect(page.url()).toBe("http://localhost:3000/");
  });
});

test.describe("Book Room Page - Form Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rooms/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Meeting Room",
          img: "",
          location: { id: 1, name: "Floor 1" },
          capacity: 8,
          amenities: [],
          start_datetime: "2024-01-01T00:00:00Z",
          end_datetime: "2024-12-31T23:59:59Z",
          recurrence_rule: "",
          is_active: true,
        } satisfies RoomResponse),
      });
    });

    await page.goto("http://localhost:3000/book-room/1");
    await page.waitForTimeout(500);
  });

  test("displays all required form fields", async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();

    // Start and end time selects
    const timeSelects = page.locator('[role="combobox"]');
    const count = await timeSelects.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("allows filling in name and email", async ({ page }) => {
    await page.locator('input[name="name"]').fill("John Doe");
    await page.locator('input[name="email"]').fill("john@example.com");

    await expect(page.locator('input[name="name"]')).toHaveValue("John Doe");
    await expect(page.locator('input[name="email"]')).toHaveValue(
      "john@example.com",
    );
  });

  test("allows selecting a date", async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];

    await page.locator('input[type="date"]').fill(dateString);

    await expect(page.locator('input[type="date"]')).toHaveValue(dateString);
  });
});

test.describe("Book Room Page - Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rooms/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Meeting Room",
          img: "",
          location: { id: 1, name: "Floor 1" },
          capacity: 8,
          amenities: [],
          start_datetime: "2024-01-01T00:00:00Z",
          end_datetime: "2024-12-31T23:59:59Z",
          recurrence_rule: "",
          is_active: true,
        } satisfies RoomResponse),
      });
    });

    await page.goto("http://localhost:3000/book-room/1");
    await page.waitForTimeout(500);
  });

  test("shows validation error for empty required fields", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(500);

    // Should show validation messages
    const validationMessages = page.locator("text=/required|Must be/i");
    const count = await validationMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  test("validates email format", async ({ page }) => {
    await page.locator('input[name="email"]').fill("invalid-email");
    await page.locator('input[name="email"]').blur();

    await page.waitForTimeout(300);

    await expect(
      page.locator("text=/valid email|email address/i"),
    ).toBeVisible();
  });
});

test.describe("Book Room Page - Booking Submission", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rooms/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Meeting Room",
          img: "",
          location: { id: 1, name: "Floor 1" },
          capacity: 8,
          amenities: [],
          start_datetime: "2024-01-01T00:00:00Z",
          end_datetime: "2024-12-31T23:59:59Z",
          recurrence_rule: "",
          is_active: true,
        } satisfies RoomResponse),
      });
    });
  });

  test("successfully submits booking", async ({ page }) => {
    let capturedBooking: CreateBookingRequest | null = null;

    await page.route("**/bookings/**", async (route) => {
      if (route.request().method() === "POST") {
        capturedBooking = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 123,
            room: { id: 1, name: "Meeting Room" },
            visitor_name: "John Doe",
            visitor_email: "john@example.com",
            start_datetime: "2026-02-22T10:00:00Z",
            end_datetime: "2026-02-22T11:00:00Z",
            recurrence_rule: "",
            status: "CONFIRMED",
            google_event_id: "",
            created_at: "2026-02-21T12:00:00Z",
          } satisfies BookingResponse),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("http://localhost:3000/book-room/1");
    await page.waitForTimeout(500);

    // Fill form
    await page.locator('input[name="name"]').fill("John Doe");
    await page.locator('input[name="email"]').fill("john@example.com");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];
    await page.locator('input[type="date"]').fill(dateString);

    // Select start time (09:00)
    const startTimeSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Select a time|^\d{2}:\d{2}$/ })
      .first();
    await startTimeSelect.click();
    await page.waitForTimeout(200);
    await page.getByRole("option", { name: "09:00" }).first().click();

    await page.waitForTimeout(200);

    // Select end time (10:00)
    const endTimeSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Select a time|^\d{2}:\d{2}$/ })
      .last();
    await endTimeSelect.click();
    await page.waitForTimeout(200);
    await page.getByRole("option", { name: "10:00" }).first().click();

    await page.waitForTimeout(200);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Should show success message
    await expect(page.locator("text=/Awesome|success/i").first()).toBeVisible();
  });

  test("handles booking error gracefully", async ({ page }) => {
    await page.route("**/bookings/**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            non_field_errors: ["This time slot is already booked."],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("http://localhost:3000/book-room/1");
    await page.waitForTimeout(500);

    // Fill form
    await page.locator('input[name="name"]').fill("John Doe");
    await page.locator('input[name="email"]').fill("john@example.com");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];
    await page.locator('input[type="date"]').fill(dateString);

    // Select start time
    const startTimeSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Select a time|^\d{2}:\d{2}$/ })
      .first();
    await startTimeSelect.click();
    await page.waitForTimeout(200);
    await page.getByRole("option", { name: "09:00" }).first().click();

    await page.waitForTimeout(200);

    // Select end time
    const endTimeSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Select a time|^\d{2}:\d{2}$/ })
      .last();
    await endTimeSelect.click();
    await page.waitForTimeout(200);
    await page.getByRole("option", { name: "10:00" }).first().click();

    await page.waitForTimeout(200);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Should show error message
    await expect(
      page.locator("text=/Sorry|already booked/i").first(),
    ).toBeVisible();
  });
});

test.describe("Book Room Page - URL Parameters", () => {
  test("pre-populates form from URL parameters", async ({ page }) => {
    await page.route("**/rooms/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Meeting Room",
          img: "",
          location: { id: 1, name: "Floor 1" },
          capacity: 8,
          amenities: [],
          start_datetime: "2024-01-01T00:00:00Z",
          end_datetime: "2024-12-31T23:59:59Z",
          recurrence_rule: "",
          is_active: true,
        } satisfies RoomResponse),
      });
    });

    await page.goto(
      "http://localhost:3000/book-room/1?name=Jane%20Smith&email=jane@example.com&date=2026-02-25&start_time=14:00&end_time=15:30",
    );
    await page.waitForTimeout(500);

    // Check form is pre-populated
    await expect(page.locator('input[name="name"]')).toHaveValue("Jane Smith");
    await expect(page.locator('input[name="email"]')).toHaveValue(
      "jane@example.com",
    );
    await expect(page.locator('input[type="date"]')).toHaveValue("2026-02-25");
  });
});
