/**
 * @fileoverview Seed module
 * @module prisma/seed
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/db';

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
    },
  });

  // Create API keys
  const adminApiKey = await prisma.apiKey.upsert({
    where: { key: 'admin-api-key-12345' },
    update: {},
    create: {
      userId: admin.id,
      name: 'Default Admin Key',
      key: 'admin-api-key-12345',
    },
  });

  // Generate sample metrics for admin
  const now = new Date();
  const metricTypes = ['page_view', 'session', 'purchase', 'conversion', 'click'];

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate 10-20 metrics per day
    const count = Math.floor(Math.random() * 10) + 10;

    for (let j = 0; j < count; j++) {
      const metricDate = new Date(date);
      metricDate.setHours(Math.floor(Math.random() * 24));
      metricDate.setMinutes(Math.floor(Math.random() * 60));

      const type = metricTypes[Math.floor(Math.random() * metricTypes.length)];
      const value =
        type === 'purchase'
          ? parseFloat((Math.random() * 200 + 50).toFixed(2))
          : type === 'conversion'
            ? parseFloat((Math.random() * 5).toFixed(2))
            : Math.floor(Math.random() * 100) + 1;

      await prisma.metric.create({
        data: {
          userId: admin.id,
          type,
          value,
          timestamp: metricDate,
          metadata: {
            source: 'seed',
            random: true,
          },
        },
      });
    }
  }

  // Create default dashboard for admin
  const dashboard = await prisma.dashboard.create({
    data: {
      userId: admin.id,
      name: 'Default Dashboard',
      isDefault: true,
      layout: {
        widgets: [],
      },
    },
  });

  // Create sample widgets
  const widgets = [
    {
      type: 'metric_card',
      title: 'Total Page Views',
      config: { metricType: 'page_view', timeRange: '30d', aggregation: 'sum' },
      position: { x: 0, y: 0, w: 1, h: 1 },
    },
    {
      type: 'line_chart',
      title: 'Traffic Trends',
      config: { metricType: 'page_view', timeRange: '30d' },
      position: { x: 1, y: 0, w: 2, h: 2 },
    },
    {
      type: 'bar_chart',
      title: 'Daily Breakdown',
      config: { metricType: 'session', timeRange: '7d' },
      position: { x: 0, y: 1, w: 2, h: 2 },
    },
  ];

  for (const widget of widgets) {
    await prisma.widget.create({
      data: {
        dashboardId: dashboard.id,
        ...widget,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\nAdmin user:');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
  console.log('\nRegular user:');
  console.log('  Email: user@example.com');
  console.log('  Password: user123');
  console.log('\nAPI Key for data ingestion:');
  console.log('  admin-api-key-12345');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
