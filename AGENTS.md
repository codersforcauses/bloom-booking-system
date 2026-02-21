# Testing

- Fix any test or type errors until everything succeeds.
- Add or update tests for the code you change, even if nobody asked.
- For any Playwright tests with mocked API calls, mocked responses should be validated with TypeScript's "satisfies" operator, using imports from `client/src/lib/api-types.ts`.
- Using `page.waitForTimeout()` is generally discouraged in Playwright tests as it creates flaky tests
