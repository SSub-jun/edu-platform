import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const len = content.length
  let field = ''
  let row: string[] = []
  let inQuotes = false

  while (i < len) {
    const char = content[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && content[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        field += char
        i++
        continue
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      }
      if (char === ',') {
        row.push(field)
        field = ''
        i++
        continue
      }
      if (char === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        i++
        continue
      }
      if (char === '\r') {
        i++
        continue
      }
      field += char
      i++
    }
  }
  // flush last field/row
  row.push(field)
  if (row.length > 1 || row[0] !== '') rows.push(row)
  return rows
}

function getString(v: unknown): string {
  return (typeof v === 'string' ? v : String(v ?? '')).trim()
}

async function main() {
  const defaultCsvPath = path.resolve('/Users/byeonjunseob/edu-platform/exports/questions_portal_final_kospacing.csv')
  const csvPath = process.env.PORTAL_IMPORT_CSV_PATH
    ? path.resolve(process.env.PORTAL_IMPORT_CSV_PATH)
    : defaultCsvPath

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`)
  }

  const content = fs.readFileSync(csvPath, 'utf8')
  const rows = parseCSV(content)
  if (rows.length === 0) throw new Error('CSV is empty')
  const headers = rows[0]

  const noIdx = headers.findIndex(h => /^(no|index)$/i.test(h))
  const stemIdx = headers.findIndex(h => /^stem$/i.test(h))
  const answerIndexIdx = headers.findIndex(h => /^answer\s*index$/i.test(h.replace('_', ' ')))
  const choiceIdxs = headers
    .map((h, idx) => ({ h, idx }))
    .filter(({ h }) => /^choice/i.test(h))
    .map(({ idx }) => idx)
    .sort((a, b) => a - b)

  if (stemIdx === -1 || choiceIdxs.length === 0) {
    throw new Error('CSV must contain Stem and Choice_* columns')
  }

  console.log(`📄 Importing CSV: ${csvPath}`)

  // 기존 포털 데이터 정리
  await prisma.portalAnswer.deleteMany()
  await prisma.portalAttempt.deleteMany()
  await prisma.portalParticipant.deleteMany()
  await prisma.portalSessionQuestion.deleteMany()
  await prisma.portalExamSession.deleteMany()
  await prisma.portalChoice.deleteMany()
  await prisma.portalQuestion.deleteMany()
  await prisma.portalExamBank.deleteMany()

  const bank = await prisma.portalExamBank.create({ data: { title: '포털 문제은행' } })
  console.log(`✅ Created bank: ${bank.title}`)

  let imported = 0
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length === 0) continue
    const stem = getString(row[stemIdx])
    if (!stem) continue
    const choiceLabels = choiceIdxs
      .map(idx => getString(row[idx]))
      .filter(label => !!label)

    if (choiceLabels.length < 3) continue

    let answerOneBased = 1
    if (answerIndexIdx !== -1) {
      const raw = getString(row[answerIndexIdx])
      const parsed = parseInt(raw, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= choiceLabels.length) {
        answerOneBased = parsed
      }
    }
    const answerZeroBased = answerOneBased - 1

    await prisma.$transaction(async (tx) => {
      const question = await tx.portalQuestion.create({
        data: { bankId: bank.id, stem, answerId: '' },
      })
      const createdChoices: { id: string }[] = []
      for (const label of choiceLabels) {
        const c = await tx.portalChoice.create({ data: { questionId: question.id, label } })
        createdChoices.push(c)
      }
      const answerChoice = createdChoices[answerZeroBased]
      await tx.portalQuestion.update({ where: { id: question.id }, data: { answerId: answerChoice.id } })
    })
    imported++
    if (imported % 20 === 0) console.log(`📝 Imported ${imported}...`)
  }

  console.log(`🎉 Completed. Imported ${imported} questions.`)
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



