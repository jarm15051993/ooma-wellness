import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const goals = [
  'Better flexibility',
  'Stronger core',
  'Toned muscles',
  'Less stress',
  'Injury recovery',
  'Improved posture',
  'Better balance',
  'Weight management',
  'More endurance',
  'Injury prevention',
]

async function main() {
  for (let i = 0; i < goals.length; i++) {
    await prisma.goal.upsert({
      where: { label: goals[i] },
      update: { sortOrder: i + 1, isActive: true },
      create: { label: goals[i], sortOrder: i + 1, isActive: true },
    })
  }
  console.log(`✅ Seeded ${goals.length} goals`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
