export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { autoMigrateAndSeed } = await import("./lib/autoSetup");
    await autoMigrateAndSeed();
  }
}
