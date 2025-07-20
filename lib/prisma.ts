import { PrismaClient } from '@prisma/client'

// Crea una referencia global para evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['error'], // usa 'error' para evitar ruido en build
    })
  }
  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()
export default prisma
