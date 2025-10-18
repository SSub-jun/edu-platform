import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';

const prisma = new PrismaClient();

type JsonlQuestion = {
  no?: number;
  stem: string;
  choices: string[];
  answer_index?: number; // 1-based in file (if present)
};

function extractAnswerIndexFromStem(stem: string): number | null {
  // 패턴 예시: "정 답 : ①" 또는 "정답 : ②" (중간 공백 허용)
  const match = stem.match(/정\s*답\s*[:：]?\s*([①②③④⑤⑥⑦⑧⑨⑩])/);
  if (!match) return null;
  const map: Record<string, number> = {
    '①': 1,
    '②': 2,
    '③': 3,
    '④': 4,
    '⑤': 5,
    '⑥': 6,
    '⑦': 7,
    '⑧': 8,
    '⑨': 9,
    '⑩': 10,
  };
  return map[match[1]] ?? null;
}

function sanitizeStem(stem: string): string {
  // 정답 표기를 본문에서 제거 (중간 공백 허용)
  return stem.replace(/✅?\s*정\s*답\s*[:：]?\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*/g, '').trim();
}

function normalizeKoreanText(input: string): string {
  let text = input;
  // 양쪽 공백 정리
  text = text.replace(/\s+/g, ' ').trim();
  // 한글-한글 사이 공백 제거 (문자 단위로 띄어쓰기 된 데이터를 단어로 결합)
  text = text.replace(/(?<=[가-힣])\s+(?=[가-힣])/g, '');
  // 괄호/따옴표 등 앞뒤 불필요한 공백 제거
  text = text.replace(/\s+([,.:;?!\)\]»”’%])/g, '$1');
  text = text.replace(/([\(\[«“‘])\s+/g, '$1');
  return text;
}

async function importFromJsonl(filePath: string, bankId: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`JSONL file not found at: ${filePath}`);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let index = 0;
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: JsonlQuestion;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      console.warn('⚠️ Skip invalid JSON line:', trimmed.slice(0, 80));
      continue;
    }

    const originalStem = parsed.stem || '';
    const stem = normalizeKoreanText(sanitizeStem(originalStem));
    const choiceLabels = Array.isArray(parsed.choices) ? parsed.choices.map((c: string) => normalizeKoreanText(c)) : [];
    if (choiceLabels.length < 3) {
      console.warn('⚠️ Skip question with insufficient choices:', stem.slice(0, 40));
      continue;
    }

    // 우선순위: stem 내 정답 표기 → answer_index(1-based) → 1
    const fromStem = extractAnswerIndexFromStem(originalStem);
    const fromField = typeof parsed.answer_index === 'number' ? parsed.answer_index : null;
    let answerOneBased = fromStem ?? fromField ?? 1;
    if (answerOneBased < 1 || answerOneBased > choiceLabels.length) {
      answerOneBased = 1;
    }
    const answerZeroBased = answerOneBased - 1;

    // 트랜잭션으로 생성
    await prisma.$transaction(async (tx) => {
      const question = await tx.portalQuestion.create({
        data: {
          bankId,
          stem,
          answerId: '',
        },
      });

      const createdChoices = [] as { id: string }[];
      for (const label of choiceLabels) {
        const createdChoice = await tx.portalChoice.create({
          data: {
            questionId: question.id,
            label: label,
          },
        });
        createdChoices.push(createdChoice);
      }

      const answerChoice = createdChoices[answerZeroBased];
      await tx.portalQuestion.update({
        where: { id: question.id },
        data: { answerId: answerChoice.id },
      });
    });

    index++;
    if (index % 10 === 0) {
      console.log(`📝 Imported ${index} questions...`);
    }
  }

  console.log(`✅ Imported total ${index} questions from JSONL`);
}

async function main() {
  console.log('🌱 Starting Portal seed (JSONL import)...');

  // 기존 포털 데이터 정리 (참조 순서 주의)
  await prisma.portalAnswer.deleteMany();
  await prisma.portalAttempt.deleteMany();
  await prisma.portalParticipant.deleteMany();
  await prisma.portalSessionQuestion.deleteMany();
  await prisma.portalExamSession.deleteMany();
  await prisma.portalChoice.deleteMany();
  await prisma.portalQuestion.deleteMany();
  await prisma.portalExamBank.deleteMany();

  // 문제은행 생성
  const bank = await prisma.portalExamBank.create({
    data: { title: '포털 문제은행' },
  });
  console.log(`✅ Created bank: ${bank.title}`);

  // JSONL 파일에서 가져오기
  const jsonlPath = process.env.PORTAL_IMPORT_JSONL_PATH || '/Users/byeonjunseob/Downloads/questions_portal_final.jsonl';
  await importFromJsonl(jsonlPath, bank.id);

  console.log('🎉 Portal JSONL import completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Portal seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

