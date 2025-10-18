import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

interface SeedSummary {
  companies: number;
  subjects: number;
  lessons: number;
  videoParts: number;
  questions: number;
  choices: number;
  users: number;
  sessions: number;
}

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  
  const summary: SeedSummary = {
    companies: 0,
    subjects: 0,
    lessons: 0,
    videoParts: 0,
    questions: 0,
    choices: 0,
    users: 0,
    sessions: 0,
  };

  // 1. Company 생성
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'company-a' },
      update: {},
      create: {
        id: 'company-a',
        name: 'A기업',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
      },
    }),
    prisma.company.upsert({
      where: { id: 'company-b' },
      update: {},
      create: {
        id: 'company-b',
        name: 'B기업',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-31'),
        isActive: true,
      },
    }),
  ]);
  summary.companies = companies.length;
  console.log('✅ Companies created:', companies.length);

  // 2. Subject 생성
  const subject = await prisma.subject.upsert({
    where: { id: 'subject-math' },
    update: {},
    create: {
      id: 'subject-math',
      name: '수학',
      description: '기초 수학 과정',
      order: 1,
      isActive: true,
    },
  });
  summary.subjects++;
  console.log('✅ Subject created:', subject.name);

  // 3. Lessons 생성
  const lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: 'lesson-1' },
      update: {},
      create: {
        id: 'lesson-1',
        subjectId: subject.id,
        title: '1장: 수와 연산',
        description: '자연수, 정수, 유리수의 기본 개념',
        order: 1,
        isActive: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-2' },
      update: {},
      create: {
        id: 'lesson-2',
        subjectId: subject.id,
        title: '2장: 방정식',
        description: '1차 방정식의 풀이',
        order: 2,
        isActive: true,
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-3' },
      update: {},
      create: {
        id: 'lesson-3',
        subjectId: subject.id,
        title: '3장: 함수',
        description: '함수의 개념과 그래프',
        order: 3,
        isActive: true,
      },
    }),
  ]);
  summary.lessons = lessons.length;
  console.log('✅ Lessons created:', lessons.length);

  // 4. Company별 활성화 Lesson 설정
  await Promise.all([
    // A기업: 모든 Lesson 활성화
    ...lessons.map(lesson => 
      prisma.companyLesson.upsert({
        where: { 
          companyId_lessonId: {
            companyId: companies[0].id,
            lessonId: lesson.id,
          }
        },
        update: {},
        create: {
          companyId: companies[0].id,
          lessonId: lesson.id,
        },
      })
    ),
    // B기업: Lesson 1, 2만 활성화
    prisma.companyLesson.upsert({
      where: { 
        companyId_lessonId: {
          companyId: companies[1].id,
          lessonId: lessons[0].id,
        }
      },
      update: {},
      create: {
        companyId: companies[1].id,
        lessonId: lessons[0].id,
      },
    }),
    prisma.companyLesson.upsert({
      where: { 
        companyId_lessonId: {
          companyId: companies[1].id,
          lessonId: lessons[1].id,
        }
      },
      update: {},
      create: {
        companyId: companies[1].id,
        lessonId: lessons[1].id,
      },
    }),
  ]);
  console.log('✅ Company lessons configured');

  // 5. VideoParts 생성
  const videoParts = [];
  for (const lesson of lessons) {
    const partsCount = lesson.order === 1 ? 5 : lesson.order === 2 ? 3 : 4;
    for (let i = 1; i <= partsCount; i++) {
      const part = await prisma.videoPart.upsert({
        where: { id: `part-${lesson.id}-${i}` },
        update: {},
        create: {
          id: `part-${lesson.id}-${i}`,
          lessonId: lesson.id,
          title: `${lesson.title} - ${i}부`,
          description: `${lesson.title}의 ${i}번째 파트`,
          order: i,
          durationMs: (5 + i * 2) * 60 * 1000, // 7분, 9분, 11분, 13분, 15분
          isActive: true,
        },
      });
      videoParts.push(part);
    }
  }
  summary.videoParts = videoParts.length;
  console.log('✅ VideoParts created:', videoParts.length);

  // 6. Questions 생성 (Subject 단위로 20문항, 각 4지선다)
  const questions = [];
  for (let i = 1; i <= 20; i++) {
    const question = await prisma.question.upsert({
      where: { id: `question-${subject.id}-${i}` },
      update: {},
      create: {
        id: `question-${subject.id}-${i}`,
        subjectId: subject.id,
        lessonId: null, // Subject 단위 문제는 lessonId 없음
        stem: `${subject.name} 문제 ${i}번: ${getQuestionStem(i)}`,
        explanation: `${subject.name} 문제 ${i}번의 해설입니다.`,
        answerIndex: i % 4, // 0, 1, 2, 3 순환
        isActive: true,
      },
    });
    questions.push(question);

    // 4지선다 보기 생성
    for (let j = 0; j < 4; j++) {
      await prisma.choice.upsert({
        where: { id: `choice-${question.id}-${j}` },
        update: {},
        create: {
          id: `choice-${question.id}-${j}`,
          questionId: question.id,
          text: `보기 ${j + 1}: ${getChoiceText(i, j + 1)}`,
          isAnswer: j === (i % 4),
          order: j,
        },
      });
      summary.choices++;
    }
  }
  summary.questions = questions.length;
  console.log('✅ Questions created:', questions.length);
  console.log('✅ Choices created:', summary.choices);

  // 7. 기본 사용자 생성 (이미 존재하는 경우 업데이트하지 않음)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash: '$2b$10$rQZ9K8mN2pL1vX3yU7wQe.ExampleHash123', // admin123
        role: 'admin',
        phone: '010-0000-0000',
      },
    }),
    prisma.user.upsert({
      where: { username: 'teacher' },
      update: {},
      create: {
        username: 'teacher',
        passwordHash: '$2b$10$rQZ9K8mN2pL1vX3yU7wQe.ExampleHash456', // teach123
        role: 'instructor',
        phone: '010-0000-0001',
      },
    }),
    prisma.user.upsert({
      where: { username: 'user' },
      update: {},
      create: {
        username: 'user',
        passwordHash: '$2b$10$rQZ9K8mN2pL1vX3yU7wQe.ExampleHash789', // user123
        role: 'student',
        phone: '010-0000-0002',
        companyId: companies[0].id, // A기업 소속
      },
    }),
  ]);
  summary.users = users.length;
  console.log('✅ Users created:', users.length);

  // 6. 학생 사용자의 과목별 진도 초기화
  const student = users.find(u => u.role === 'student');
  if (student) {
    await prisma.subjectProgress.upsert({
      where: { 
        userId_subjectId: {
          userId: student.id,
          subjectId: subject.id,
        }
      },
      update: {},
      create: {
        userId: student.id,
        subjectId: subject.id,
        progressPercent: 0.0,
        lastLessonId: null,
        lastPartId: null,
        lastPlayedMs: 0,
      },
    });
    console.log('✅ Student progress initialized');
  }

  console.log('🎉 Main database seed completed successfully!');
  
  // 📊 Seed 요약 출력
  console.log('\n📊 Main Seed Summary:');
  console.log('┌─────────────┬─────────┐');
  console.log('│ Entity      │ Count   │');
  console.log('├─────────────┼─────────┤');
  console.log(`│ Companies   │ ${summary.companies.toString().padStart(7)} │`);
  console.log(`│ Subjects    │ ${summary.subjects.toString().padStart(7)} │`);
  console.log(`│ Lessons     │ ${summary.lessons.toString().padStart(7)} │`);
  console.log(`│ VideoParts  │ ${summary.videoParts.toString().padStart(7)} │`);
  console.log(`│ Questions   │ ${summary.questions.toString().padStart(7)} │`);
  console.log(`│ Choices     │ ${summary.choices.toString().padStart(7)} │`);
  console.log(`│ Users       │ ${summary.users.toString().padStart(7)} │`);
  console.log(`│ Sessions    │ ${summary.sessions.toString().padStart(7)} │`);
  console.log('└─────────────┴─────────┘');

  // Portal 시드 실행
  console.log('\n🌱 Starting Portal seed...');
  try {
    execSync('npx tsx portal.seed.ts', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Portal seed completed successfully!');
  } catch (error) {
    console.error('❌ Portal seed failed:', error);
    // Portal 시드 실패해도 메인 시드는 성공으로 처리
  }

  console.log('\n🚀 Ready for development!');
}

function getQuestionStem(questionNumber: number): string {
  const stems = [
    '자연수 1부터 10까지의 합을 구하시오.',
    '방정식 2x + 3 = 7의 해를 구하시오.',
    '함수 f(x) = 2x + 1의 그래프를 그리시오.',
    '분수 3/4와 2/3의 합을 구하시오.',
    '직사각형의 넓이가 24이고 가로가 6일 때 세로를 구하시오.',
    '이차방정식 x² - 5x + 6 = 0의 해를 구하시오.',
    '삼각형의 세 각의 합은 몇 도인가요?',
    '원의 넓이 공식을 쓰시오.',
    '로그 log₂8의 값을 구하시오.',
    '미분 dy/dx를 구하시오.',
    '적분 ∫x²dx를 구하시오.',
    '확률 P(A∪B)를 구하시오.',
    '통계에서 평균을 구하는 공식을 쓰시오.',
    '기하학에서 피타고라스 정리를 설명하시오.',
    '대수학에서 인수분해를 수행하시오.',
  ];
  return stems[(questionNumber - 1) % stems.length];
}

function getChoiceText(questionNumber: number, choiceNumber: number): string {
  const choices = [
    ['55', '56', '57', '58'],
    ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
    ['직선', '포물선', '지수함수', '로그함수'],
    ['5/7', '17/12', '6/7', '1/12'],
    ['4', '5', '6', '7'],
    ['x = 2, 3', 'x = 1, 6', 'x = -2, -3', 'x = 0, 5'],
    ['90도', '180도', '270도', '360도'],
    ['πr', 'πr²', '2πr', '4πr²'],
    ['2', '3', '4', '5'],
    ['2x', '2', 'x', '1'],
    ['x³/3 + C', 'x²/2 + C', 'x + C', 'C'],
    ['P(A) + P(B)', 'P(A) + P(B) - P(A∩B)', 'P(A) × P(B)', 'P(A) / P(B)'],
    ['∑x/n', '∑x²/n', '√∑x²/n', '∑(x-μ)²/n'],
    ['a² + b² = c²', 'a + b = c', 'a × b = c', 'a ÷ b = c'],
    ['(x+1)(x+2)', '(x-1)(x-2)', '(x+1)(x-2)', '(x-1)(x+2)'],
  ];
  const questionIndex = (questionNumber - 1) % choices.length;
  const choiceIndex = (choiceNumber - 1) % 4;
  return choices[questionIndex][choiceIndex];
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
