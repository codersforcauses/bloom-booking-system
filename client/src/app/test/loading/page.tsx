async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function LoadingTestPage() {
  // Simulate slow data / API call
  await sleep(3000);

  return (
    <main className="space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Loading Test Page</h1>

      <p className="text-muted-foreground">
        Refresh the page! If you saw a spinner for ~3 seconds, the{" "}
        <code>loading.tsx</code> works.
      </p>
    </main>
  );
}
