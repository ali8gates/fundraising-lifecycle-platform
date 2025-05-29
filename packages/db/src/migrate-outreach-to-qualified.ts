/**
 * One-off: set any Company.stage = 'OUTREACH' to 'QUALIFIED' before removing OUTREACH from Stage enum.
 * Run: pnpm --filter @chti/db exec ts-node src/migrate-outreach-to-qualified.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(
    'UPDATE "Company" SET stage = \'QUALIFIED\' WHERE stage = \'OUTREACH\''
  );
  if (Number(result) > 0) {
    console.log(`Migrated ${result} company/companies from OUTREACH to QUALIFIED.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
