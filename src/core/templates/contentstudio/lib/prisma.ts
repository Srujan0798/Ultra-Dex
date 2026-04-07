const prisma = new PrismaClient();
function handlePrismaError(error) {
  try {
    console.error("[prisma]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  prisma
};
