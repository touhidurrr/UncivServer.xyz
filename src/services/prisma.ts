import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const adapter = new PrismaLibSQL(libsql);
export const prisma = new PrismaClient({ adapter });

export const getGameWithPrima = async (gameId: string) => {
  const isPreview = gameId.endsWith('_Preview');
  const game = await prisma.game.findUnique({
    where: { id: isPreview ? gameId.slice(0, -8) : gameId },
    select: {
      preview: isPreview,
      save: !isPreview,
    },
  });
  return game && (isPreview ? game.preview : game.save);
};

await prisma.$connect();
export default prisma;
