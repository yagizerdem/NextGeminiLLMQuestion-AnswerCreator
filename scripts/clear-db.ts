// Deletes every document in every collection of the database in MONGODB_URI.
// Collections and indexes are kept; only documents are removed.
//
// Usage: node scripts/clear-db.ts --yes

import mongoose from "mongoose";

try {
  process.loadEnvFile(".env");
} catch {
  // Fall back to variables already present in the environment.
}

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is not defined. Add it to the .env file.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error(
    "This deletes ALL documents in the database. Re-run with --yes to confirm.",
  );
  process.exit(1);
}

async function main() {
  await mongoose.connect(mongoUri!);

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready.");

  console.log(
    `Connected to "${db.databaseName}" on ${mongoose.connection.host}`,
  );

  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();
  const targets = collections.filter((c) => !c.name.startsWith("system."));

  if (targets.length === 0) {
    console.log("No collections found. Nothing to clear.");
    return;
  }

  let total = 0;
  for (const { name } of targets) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    total += deletedCount;
    console.log(`  ${name}: ${deletedCount} document(s) deleted`);
  }

  console.log(
    `Done. ${total} document(s) deleted from ${targets.length} collection(s).`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to clear database:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
