import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Portal seed...');

  // 환경변수에서 시드 설정 가져오기
  const seedQuestionCount = parseInt(process.env.PORTAL_SEED_QUESTION_COUNT || '60');
  const minChoices = parseInt(process.env.PORTAL_MIN_CHOICES_PER_QUESTION || '3');
  const maxChoices = parseInt(process.env.PORTAL_MAX_CHOICES_PER_QUESTION || '10');

  console.log(`📊 Creating ${seedQuestionCount} questions with ${minChoices}-${maxChoices} choices each...`);

  // 기본 문제은행 생성
  const examBank = await prisma.portalExamBank.upsert({
    where: { id: 'default-bank' },
    update: {},
    create: {
      id: 'default-bank',
      title: '기본 문제은행',
    },
  });

  console.log(`✅ Created exam bank: ${examBank.title}`);

  // 문제 생성
  const questions = [];
  for (let i = 1; i <= seedQuestionCount; i++) {
    // 가변 보기 수 생성 (3~6개 사이)
    const choiceCount = Math.floor(Math.random() * (6 - 3 + 1)) + 3;
    
    // 보기 텍스트 생성
    const choices = [];
    for (let j = 1; j <= choiceCount; j++) {
      choices.push({
        label: `보기 ${j}`,
      });
    }

    // 정답 인덱스 랜덤 선택
    const answerIndex = Math.floor(Math.random() * choiceCount);

    // 문제 생성
    const question = await prisma.portalQuestion.create({
      data: {
        bankId: examBank.id,
        stem: `문제 ${i}: 다음 중 올바른 것은?`,
        answerId: '', // 임시값, 보기 생성 후 업데이트
      },
    });

    // 보기 생성
    const createdChoices = [];
    for (const choice of choices) {
      const createdChoice = await prisma.portalChoice.create({
        data: {
          questionId: question.id,
          label: choice.label,
        },
      });
      createdChoices.push(createdChoice);
    }

    // 정답 설정
    const answerChoice = createdChoices[answerIndex];
    await prisma.portalQuestion.update({
      where: { id: question.id },
      data: { answerId: answerChoice.id },
    });

    questions.push({
      ...question,
      answerId: answerChoice.id,
      choices: createdChoices,
    });

    if (i % 10 === 0) {
      console.log(`📝 Created ${i}/${seedQuestionCount} questions...`);
    }
  }

  console.log(`✅ Created ${questions.length} questions with variable choices`);

  // 샘플 세션 생성
  const sampleSession = await prisma.portalExamSession.create({
    data: {
      sessionNo: 1,
      code: 'SAMPLE01',
      title: '샘플 시험 세션',
      bankId: examBank.id,
      mode: 'RANDOM',
      questionCount: 20,
      isPublished: true,
    },
  });

  console.log(`✅ Created sample session: ${sampleSession.title} (${sampleSession.code})`);

  console.log('🎉 Portal seed completed successfully!');
  console.log(`📋 Summary:`);
  console.log(`   - Exam Bank: ${examBank.title}`);
  console.log(`   - Questions: ${questions.length}`);
  console.log(`   - Sample Session: ${sampleSession.code}`);
  console.log(`   - Choices per question: ${minChoices}-${maxChoices} (variable)`);
}

main()
  .catch((e) => {
    console.error('❌ Portal seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





