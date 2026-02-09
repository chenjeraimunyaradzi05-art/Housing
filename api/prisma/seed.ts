/**
 * Database Seed Script
 * Populates the database with sample data for development
 *
 * Usage: npx prisma db seed
 * Or: npm run db:seed
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ==================== USERS ====================
  console.log('Creating users...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vor.com' },
    update: {},
    create: {
      email: 'admin@vor.com',
      username: 'vor_admin',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      identityVerified: true,
      kycStatus: 'VERIFIED',
      membershipLevel: 'premium',
      country: 'US',
    },
  });
  console.log(`  ✅ Admin user: ${adminUser.email}`);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@vor.com' },
    update: {},
    create: {
      email: 'demo@vor.com',
      username: 'demo_user',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      status: 'active',
      emailVerified: true,
      identityVerified: true,
      kycStatus: 'VERIFIED',
      membershipLevel: 'basic',
      country: 'US',
      bio: 'Real estate enthusiast looking to build generational wealth.',
    },
  });
  console.log(`  ✅ Demo user: ${demoUser.email}`);

  const investorUser = await prisma.user.upsert({
    where: { email: 'investor@vor.com' },
    update: {},
    create: {
      email: 'investor@vor.com',
      username: 'savvy_investor',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Investor',
      role: 'user',
      status: 'active',
      emailVerified: true,
      identityVerified: true,
      kycStatus: 'VERIFIED',
      membershipLevel: 'premium',
      country: 'US',
      bio: 'Experienced real estate investor focused on multifamily properties.',
    },
  });
  console.log(`  ✅ Investor user: ${investorUser.email}`);

  // ==================== PROPERTIES ====================
  console.log('\nCreating properties...');

  const properties = [
    {
      title: 'Modern Downtown Condo',
      slug: 'modern-downtown-condo-atlanta',
      description: 'Beautiful 2BR/2BA condo in the heart of downtown Atlanta with stunning city views.',
      type: 'condo',
      status: 'active',
      street: '123 Peachtree St NW',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30303',
      country: 'US',
      latitude: new Prisma.Decimal(33.7490),
      longitude: new Prisma.Decimal(-84.3880),
      bedrooms: 2,
      bathrooms: new Prisma.Decimal(2),
      squareFeet: 1200,
      yearBuilt: 2020,
      price: new Prisma.Decimal(450000),
      monthlyRent: new Prisma.Decimal(2500),
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
      features: ['Gym', 'Pool', 'Concierge', 'Parking'],
      ownerId: demoUser.id,
    },
    {
      title: 'Charming Victorian Home',
      slug: 'charming-victorian-home-savannah',
      description: 'Historic Victorian home with original hardwood floors and modern updates.',
      type: 'single_family',
      status: 'active',
      street: '456 Bull St',
      city: 'Savannah',
      state: 'GA',
      zipCode: '31401',
      country: 'US',
      latitude: new Prisma.Decimal(32.0809),
      longitude: new Prisma.Decimal(-81.0912),
      bedrooms: 4,
      bathrooms: new Prisma.Decimal(3),
      squareFeet: 2800,
      yearBuilt: 1890,
      price: new Prisma.Decimal(680000),
      monthlyRent: new Prisma.Decimal(3200),
      images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
      features: ['Historic', 'Garden', 'Fireplace', 'Updated Kitchen'],
      ownerId: investorUser.id,
    },
    {
      title: 'Luxury Beachfront Villa',
      slug: 'luxury-beachfront-villa-miami',
      description: 'Stunning 5BR oceanfront property with private beach access and infinity pool.',
      type: 'single_family',
      status: 'active',
      street: '789 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139',
      country: 'US',
      latitude: new Prisma.Decimal(25.7825),
      longitude: new Prisma.Decimal(-80.1340),
      bedrooms: 5,
      bathrooms: new Prisma.Decimal(5.5),
      squareFeet: 5500,
      yearBuilt: 2018,
      price: new Prisma.Decimal(3500000),
      monthlyRent: new Prisma.Decimal(15000),
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
      features: ['Beach Access', 'Pool', 'Smart Home', 'Wine Cellar', 'Guest House'],
      ownerId: adminUser.id,
    },
  ];

  for (const property of properties) {
    const created = await prisma.property.upsert({
      where: { slug: property.slug },
      update: {},
      create: property,
    });
    console.log(`  ✅ Property: ${created.title}`);
  }

  // ==================== CO-INVESTMENT POOLS ====================
  console.log('\nCreating co-investment pools...');

  const pools = [
    {
      name: 'Atlanta Tech Hub Portfolio',
      slug: 'atlanta-tech-hub-portfolio',
      description: 'Diversified portfolio of tech-adjacent properties in Atlanta\'s growing tech corridor.',
      targetAmount: new Prisma.Decimal(2000000),
      minimumInvestment: new Prisma.Decimal(500),
      currentAmount: new Prisma.Decimal(850000),
      expectedReturn: new Prisma.Decimal(12.5),
      status: 'seeking_investors',
      poolType: 'equity',
      riskLevel: 'moderate',
      term: 60,
      managementFee: new Prisma.Decimal(1.5),
      images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'],
      highlights: ['Strong job growth area', 'Near Beltline', 'Multiple property types'],
      ownerId: adminUser.id,
    },
    {
      name: 'Florida Sunshine Portfolio',
      slug: 'florida-sunshine-portfolio',
      description: 'Collection of vacation rental properties across Florida\'s most popular destinations.',
      targetAmount: new Prisma.Decimal(5000000),
      minimumInvestment: new Prisma.Decimal(1000),
      currentAmount: new Prisma.Decimal(3200000),
      expectedReturn: new Prisma.Decimal(15),
      status: 'seeking_investors',
      poolType: 'equity',
      riskLevel: 'moderate_high',
      term: 48,
      managementFee: new Prisma.Decimal(2),
      images: ['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800'],
      highlights: ['Tourism hotspot', 'High rental demand', 'Tax advantages'],
      ownerId: investorUser.id,
    },
  ];

  for (const pool of pools) {
    const created = await prisma.coInvestmentPool.upsert({
      where: { slug: pool.slug },
      update: {},
      create: pool,
    });
    console.log(`  ✅ Pool: ${created.name}`);
  }

  // ==================== SAMPLE INVESTMENT ====================
  console.log('\nCreating sample investments...');

  const atlantaPool = await prisma.coInvestmentPool.findUnique({
    where: { slug: 'atlanta-tech-hub-portfolio' },
  });

  if (atlantaPool) {
    const investment = await prisma.coInvestmentInvestor.upsert({
      where: {
        poolId_userId: {
          poolId: atlantaPool.id,
          userId: demoUser.id,
        },
      },
      update: {},
      create: {
        poolId: atlantaPool.id,
        userId: demoUser.id,
        amountInvested: new Prisma.Decimal(5000),
        shares: new Prisma.Decimal(5),
        status: 'active',
        investmentType: 'initial',
      },
    });
    console.log(`  ✅ Investment: Demo user invested $${investment.amountInvested} in Atlanta Tech Hub`);
  }

  // ==================== COMMUNITY GROUPS ====================
  console.log('\nCreating community groups...');

  const groups = [
    {
      name: 'First-Time Investors',
      slug: 'first-time-investors',
      description: 'A supportive community for women starting their real estate investment journey.',
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      isPrivate: false,
      ownerId: adminUser.id,
    },
    {
      name: 'Multifamily Mastery',
      slug: 'multifamily-mastery',
      description: 'Discussion and deal-sharing for multifamily property investors.',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      isPrivate: false,
      ownerId: investorUser.id,
    },
    {
      name: 'VÖR Premium Members',
      slug: 'vor-premium-members',
      description: 'Exclusive group for premium members with access to special deals and events.',
      coverImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800',
      isPrivate: true,
      ownerId: adminUser.id,
    },
  ];

  for (const group of groups) {
    const created = await prisma.communityGroup.upsert({
      where: { slug: group.slug },
      update: {},
      create: group,
    });

    // Add owner as admin member
    await prisma.groupMembership.upsert({
      where: {
        groupId_userId: {
          groupId: created.id,
          userId: group.ownerId,
        },
      },
      update: {},
      create: {
        groupId: created.id,
        userId: group.ownerId,
        role: 'admin',
      },
    });

    console.log(`  ✅ Group: ${created.name}`);
  }

  console.log('\n✅ Database seed completed successfully!\n');
  console.log('Demo Accounts:');
  console.log('  Admin: admin@vor.com / Password123!');
  console.log('  Demo:  demo@vor.com / Password123!');
  console.log('  Investor: investor@vor.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
