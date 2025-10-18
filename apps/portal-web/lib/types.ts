export interface PortalExamBank {
  id: string
  title: string
  questions: PortalQuestion[]
  createdAt: string
}

export interface PortalQuestion {
  id: string
  bankId: string
  stem: string
  choices: PortalChoice[]
  answerId: string
  createdAt: string
}

export interface PortalChoice {
  id: string
  questionId: string
  label: string
}

export interface PortalExamSession {
  id: string
  sessionNo: number
  code: string
  title: string
  bankId?: string
  bank?: PortalExamBank
  mode: 'RANDOM' | 'MANUAL'
  questionCount: number
  isPublished: boolean
  closedAt?: string
  createdAt: string
  questions?: PortalSessionQuestion[]
  participants?: PortalParticipant[]
  attempts?: PortalAttempt[]
  _count?: { participants?: number; attempts?: number }
}

export interface PortalSessionQuestion {
  id: string
  sessionId: string
  questionId: string
  orderIndex: number
  question: PortalQuestion
}

export interface PortalParticipant {
  id: string
  sessionId: string
  name: string
  pin4: string
  createdAt: string
}

export interface PortalAttempt {
  id: string
  sessionId: string
  participantId: string
  startedAt: string
  submittedAt?: string
  score?: number
  passed?: boolean
  answers?: PortalAnswer[]
  participant?: PortalParticipant
}

export interface PortalAnswer {
  id: string
  attemptId: string
  questionId: string
  choiceId: string
}

export interface ExamQuestion {
  id: string
  stem: string
  choices: {
    id: string
    label: string
  }[]
}

export interface ExamAttempt {
  attemptId: string
  questions: ExamQuestion[]
}

export interface SubmitAnswer {
  questionId: string
  choiceId: string
}

export interface ExamResult {
  attemptId: string
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
}




