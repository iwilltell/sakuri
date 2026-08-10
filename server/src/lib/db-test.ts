import { prisma } from "./prisma.js";

async function main() {
  await prisma.$connect();

  const accountCount =
    await prisma.account.count();

  const profileCount =
    await prisma.profile.count();

  console.log("🌸 Sakuri database connected.");
  console.log(`Accounts: ${accountCount}`);
  console.log(`Profiles: ${profileCount}`);
}

main()
  .catch((error) => {
    console.error(
      "Database connection failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });