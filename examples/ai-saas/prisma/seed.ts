import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Start seeding...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      credits: 100,
      plan: 'FREE',
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create sample conversations
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Sample Conversation',
      model: 'gpt-3.5-turbo',
      messages: {
        create: [
          {
            role: 'user',
            content: 'Hello, how are you?',
            tokensUsed: 10,
          },
          {
            role: 'assistant',
            content: "I'm doing well, thank you for asking! How can I help you today?",
            tokensUsed: 20,
          },
        ],
      },
    },
  });

  console.log(`Created conversation: ${conversation.id}`);

  // Create sample credit transactions
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: user.id,
        amount: 100,
        type: 'BONUS',
        description: 'Welcome bonus',
      },
      {
        userId: user.id,
        amount: -5,
        type: 'USAGE',
        description: 'Chat usage - 50 tokens',
      },
    ],
  });

  console.log('Created credit transactions');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
