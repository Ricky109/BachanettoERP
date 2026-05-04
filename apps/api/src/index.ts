import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  await prisma.$connect();
  console.log('✅ Base de datos conectada');

  app.listen(env.PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${env.PORT}`);
    console.log(`   Entorno: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  console.error('❌ Error al iniciar:', err);
  process.exit(1);
});