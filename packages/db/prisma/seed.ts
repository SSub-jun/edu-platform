import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 기존 데이터 정리
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // bcrypt 설정 (개발용으로 낮은 cost 사용)
  const saltRounds = 10;

  // 사용자 생성
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin' as const,
      phone: '010-0000-0001'
    },
    {
      username: 'teacher',
      password: 'teach123',
      role: 'instructor' as const,
      phone: '010-0000-0002'
    },
    {
      username: 'user',
      password: 'user123',
      role: 'student' as const,
      phone: '010-0000-0003'
    }
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        passwordHash,
        role: userData.role,
        phone: userData.phone
      }
    });

    console.log(`✅ Created user: ${user.username} (${user.role})`);
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
