import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkSessions() {
  try {
    // 최근 2개 세션 조회
    const sessions = await prisma.portalExamSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                stem: true
              }
            }
          }
        },
        bank: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    console.log('\n=== 최근 생성된 2개 세션 비교 ===\n');
    
    sessions.forEach((session, idx) => {
      console.log(`\n[세션 ${idx + 1}]`);
      console.log(`ID: ${session.id}`);
      console.log(`코드: ${session.code}`);
      console.log(`모드: ${session.mode}`);
      console.log(`문제은행: ${session.bank?.title || 'N/A'}`);
      console.log(`생성일: ${session.createdAt}`);
      console.log(`\n출제된 문제들 (${session.questions.length}개):`);
      
      session.questions.forEach((sq) => {
        console.log(`  ${sq.orderIndex + 1}. [${sq.question.id}] ${sq.question.stem.substring(0, 50)}...`);
      });
    });

    // 두 세션의 문제 ID 비교
    if (sessions.length === 2) {
      const session1QuestionIds = sessions[0].questions.map(sq => sq.question.id).sort();
      const session2QuestionIds = sessions[1].questions.map(sq => sq.question.id).sort();
      
      const identical = JSON.stringify(session1QuestionIds) === JSON.stringify(session2QuestionIds);
      
      console.log('\n\n=== 비교 결과 ===');
      console.log(`세션 1 문제 ID: ${session1QuestionIds.join(', ')}`);
      console.log(`세션 2 문제 ID: ${session2QuestionIds.join(', ')}`);
      console.log(`\n두 세션의 문제가 동일한가? ${identical ? '❌ YES (문제!)' : '✅ NO (정상)'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();
