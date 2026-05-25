import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Update existing packages with Stripe price IDs ──────────────────────────
  const updates: { id: string; stripePriceId: string; name: string }[] = [
    // YOGA
    { id: 'cmnvtyumj0005xlzplymprquq', stripePriceId: 'price_1TOdhA6KQne3paisj7Y5ozgD', name: 'Clase Suelta · Yoga' },
    { id: 'cmnvtyumj0009xlzprhps4gfw', stripePriceId: 'price_1TOd1G6KQne3paisT2EGjEkv', name: 'Mensual Ilimitado · Yoga' },
    { id: 'cmnvtyumj0008xlzp34140wae', stripePriceId: 'price_1TOczC6KQne3paismMPHWC',  name: 'Mensual · 15 Clases · Yoga' },
    { id: 'cmnvtyumj0007xlzplz9k8sgu', stripePriceId: 'price_1TOcvv6KQne3paisOk4Yr99A', name: 'Mensual · 8 Clases · Yoga' },
    { id: 'cmnvtyumj0006xlzprhvd56xv', stripePriceId: 'price_1TOcuN6KQne3pais2d8XTJou', name: 'Mensual · 4 Clases · Yoga' },
    // PILATES (REFORMER)
    { id: 'cmnvtyu8w0000xlzplqmsf85a', stripePriceId: 'price_1TOdfi6KQne3paisnHrXuJG7', name: 'Clase Suelta · Pilates' },
    { id: 'cmnvtyu8w0004xlzpb3phr6ts', stripePriceId: 'price_1TOcri6KQne3paisYNROERTr', name: 'Mensual Ilimitado · Pilates' },
    { id: 'cmnvtyu8w0003xlzpop2w48vw', stripePriceId: 'price_1TOcnR6KQne3pais1q6mSRws', name: 'Mensual · 15 Clases · Pilates' },
    { id: 'cmnvtyu8w0002xlzp13g6ubif', stripePriceId: 'price_1TOckc6KQne3paism8SRmoxN', name: 'Mensual · 8 Clases · Pilates' },
    { id: 'cmnvtyu8w0001xlzpfbtgkdrw', stripePriceId: 'price_1TOc8Z6KQne3paisOBs1x1jf', name: 'Mensual · 4 Clases · Pilates' },
    // COMBINADA (BOTH)
    { id: 'cmnvtyv02000dxlzpp3dvx9ur', stripePriceId: 'price_1TOdad6KQne3pais7363c1BY', name: 'Mensual Ilimitado · Combinado' },
    { id: 'cmnvtyv02000cxlzp2xvytzh2', stripePriceId: 'price_1TOdX56KQne3paisgCTVn4AI', name: 'Mensual · 15 Clases · Combinado' },
    { id: 'cmnvtyv02000bxlzpzm8afpyz', stripePriceId: 'price_1TOdUp6KQne3paisEJspPefg', name: 'Mensual · 8 Clases · Combinado' },
    { id: 'cmnvtyv02000axlzpjiabqfvy', stripePriceId: 'price_1TOdTR6KQne3paiseROxmeG',  name: 'Mensual · 4 Clases · Combinado' },
  ]

  for (const u of updates) {
    await prisma.package.update({
      where: { id: u.id },
      data: { stripePriceId: u.stripePriceId, name: u.name, active: true },
    })
    console.log(`✓ Updated: ${u.name}`)
  }

  // ── Create TEST packages (new Stripe prices, no matching DB record) ──────────
  const testPackages = [
    {
      name: 'Mensual Test · Yoga',
      classCount: 2, price: 1, durationDays: 30,
      packageType: 'YOGA' as const, isUnlimited: false,
      stripePriceId: 'price_1TOd2u6KQne3paisOZcFGR07',
    },
    {
      name: 'Mensual Test · Pilates',
      classCount: 2, price: 1, durationDays: 30,
      packageType: 'REFORMER' as const, isUnlimited: false,
      stripePriceId: 'price_1TOcBk6KQne3pais66XvDSCs',
    },
    {
      name: 'Mensual Test · Combinado',
      classCount: 2, price: 1, durationDays: 30,
      packageType: 'BOTH' as const, isUnlimited: false,
      stripePriceId: 'price_1TOdbx6KQne3paiso2Dy8hzB',
    },
  ]

  for (const pkg of testPackages) {
    await prisma.package.upsert({
      where: { stripePriceId: pkg.stripePriceId },
      update: { active: true },
      create: { ...pkg, active: true, isStudentPackage: false },
    })
    console.log(`✓ Upserted: ${pkg.name}`)
  }

  // ── Fix YOGA 15-class package (existing had 12 classes, update to 15) ────────
  await prisma.package.update({
    where: { id: 'cmnvtyumj0008xlzp34140wae' },
    data: { classCount: 15, price: 135, name: 'Mensual · 15 Clases · Yoga' },
  })
  console.log('✓ Fixed: Mensual · 15 Clases · Yoga (classCount 12→15, price 108→135)')

  console.log('\nDone.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
