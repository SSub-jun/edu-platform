'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { ExamQuestion, ExamAttempt, SubmitAnswer } from '@/lib/types'

export default function StartPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0) // 세션의 timeLimitMinutes로 초기화
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(0) // 현재 5개 그룹 인덱스

  // 세션 정보 조회
  const { data: session } = useQuery({
    queryKey: ['session', code],
    queryFn: async () => {
      const response = await apiClient.get(`/portal/sessions/${code}`)
      return response.data
    },
    enabled: !!code,
  })

  // 시험 시작
  const startExamMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Session not found')
      const response = await apiClient.post(`/portal/sessions/${session.id}/start`)
      return response.data as ExamAttempt
    },
    onSuccess: (data) => {
      // 시험 데이터를 localStorage에 저장
      const examDataWithSession = {
        ...data,
        sessionId: session?.id,
        sessionCode: code,
      }
      localStorage.setItem('portal_exam_data', JSON.stringify(examDataWithSession))
      
      // 상태 즉시 업데이트
      setExamData(examDataWithSession)
      setHasExamData(true)
      setBelongsToSession(true)
    }
  })

  // 답안 제출
  const submitMutation = useMutation({
    mutationFn: async (submitData: { answers: SubmitAnswer[] }) => {
      const examData = JSON.parse(localStorage.getItem('portal_exam_data') || '{}')
      const response = await apiClient.post(`/portal/attempts/${examData.attemptId}/submit`, submitData)
      return response.data
    },
    onSuccess: (data) => {
      // 결과 페이지로 이동
      const examData = JSON.parse(localStorage.getItem('portal_exam_data') || '{}')
      router.push(`/p/${code}/result/${examData.attemptId}`)
    }
  })

  // 시험 데이터 상태 (hydration 오류 방지를 위해 useEffect로 처리)
  const [examData, setExamData] = useState<ExamAttempt | (ExamAttempt & { sessionId?: string; sessionCode?: string }) | null>(null)
  const [hasExamData, setHasExamData] = useState(false)
  const [belongsToSession, setBelongsToSession] = useState(false)
  const effectiveHasExamData = hasExamData && belongsToSession

  // 클라이언트에서만 localStorage 데이터 로드
  useEffect(() => {
    const rawExamData = localStorage.getItem('portal_exam_data')
    const parsedExamData = rawExamData ? JSON.parse(rawExamData) : null
    const hasData = !!(parsedExamData && Array.isArray(parsedExamData.questions) && parsedExamData.questions.length > 0)
    const belongsToCurrentSession = !!(session && parsedExamData && parsedExamData.sessionId === session.id)
    
    setExamData(parsedExamData)
    setHasExamData(hasData)
    setBelongsToSession(belongsToCurrentSession)
  }, [session])

  // 기본 계산값들 (변수 선언 순서 문제 해결)
  const totalQuestions = effectiveHasExamData ? (examData as any).questions.length : 0
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === totalQuestions

  // 타이머 효과
  useEffect(() => {
    // timeLeft가 0이고 examData가 없으면 아직 시험이 시작되지 않은 것
    if (timeLeft <= 0 && effectiveHasExamData) {
      handleSubmit(true) // 시간 만료 시 강제 제출
      return
    }

    // timeLeft가 0이면 타이머를 시작하지 않음 (아직 초기화 전)
    if (timeLeft <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, effectiveHasExamData])

  // 세션 시간 제한 설정 (기본값: 30분)
  useEffect(() => {
    if (session && timeLeft === 0) {
      const defaultTimeLimit = 30 // 기본 30분
      setTimeLeft(defaultTimeLimit * 60) // 분을 초로 변환
    }
  }, [session, timeLeft])

  // 시험 시작
  useEffect(() => {
    if (!session) return
    // 세션이 바뀌었는데 이전 세션의 시험 데이터가 남아있으면 정리
    if (examData && (examData as any).sessionId && (examData as any).sessionId !== session.id) {
      localStorage.removeItem('portal_exam_data')
    }
    if (session && !effectiveHasExamData && !startExamMutation.isPending) {
      startExamMutation.mutate()
    }
  }, [session, effectiveHasExamData])

  const handleAnswerSelect = (questionId: string, choiceId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }))
  }

  // 현재 문제에 따라 그룹 자동 업데이트
  const questionsPerGroup = 5
  const totalGroups = Math.ceil(totalQuestions / questionsPerGroup)
  const currentQuestionGroup = Math.floor(currentQuestionIndex / questionsPerGroup)
  
  // 그룹이 바뀌면 currentGroup 업데이트
  React.useEffect(() => {
    setCurrentGroup(currentQuestionGroup)
  }, [currentQuestionGroup])

  // 현재 그룹에서 보여줄 문제 번호들 계산
  const getVisibleQuestions = () => {
    const startIdx = currentGroup * questionsPerGroup
    const endIdx = Math.min(startIdx + questionsPerGroup, totalQuestions)
    return Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i)
  }

  const goToPreviousGroup = () => {
    if (currentGroup > 0) {
      setCurrentGroup(prev => prev - 1)
    }
  }

  const goToNextGroup = () => {
    if (currentGroup < totalGroups - 1) {
      setCurrentGroup(prev => prev + 1)
    }
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSubmit = async (forceSubmit = false) => {
    if (isSubmitting) return
    
    if (!examData || !Array.isArray((examData as any).questions)) {
      window.alert('시험 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.')
      return
    }

    const submitAnswers: SubmitAnswer[] = examData.questions.map(q => {
      const answerId = answers[q.id]
      if (answerId) {
        return { questionId: q.id, choiceId: answerId }
      }
      
      // 답이 없는 경우: 시간 만료 시에는 첫 번째 선택지로 자동 설정, 일반 제출 시에는 빈 값
      return {
        questionId: q.id,
        choiceId: forceSubmit ? q.choices[0]?.id || '' : ''
      }
    })

    // 일반 제출 시에만 모든 문제에 답했는지 확인
    if (!forceSubmit) {
      const unansweredQuestions = submitAnswers.filter(a => !a.choiceId)
      if (unansweredQuestions.length > 0) {
        window.alert(`모든 문항에 답변해야 제출할 수 있습니다. 남은 문항: ${unansweredQuestions.length}개`)
        return
      }
    }

    setIsSubmitting(true)

    // 강제 제출인 경우 사용자에게 알림
    if (forceSubmit) {
      const unansweredQuestions = submitAnswers.filter(a => !answers[a.questionId])
      if (unansweredQuestions.length > 0) {
        window.alert(`시간이 만료되어 자동 제출됩니다. 미답변 문항 ${unansweredQuestions.length}개는 자동으로 오답 처리됩니다.`)
      }
    }

    submitMutation.mutate({ answers: submitAnswers })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (startExamMutation.isPending || !effectiveHasExamData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시험을 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (startExamMutation.error || !examData || !effectiveHasExamData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md w_full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-6">시험을 시작할 수 없습니다.</p>
          <button
            onClick={() => router.push(`/p/${code}`)}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = examData.questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{session?.title}</h1>
              <p className="text-sm text-gray-600">문제 {currentQuestionIndex + 1} / {totalQuestions}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-600">남은 시간</p>
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="flex justify_between text-sm text-gray-600 mb-1">
              <span>진행률</span>
              <span>{answeredCount} / {totalQuestions} 답변 완료</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 문제 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.stem}
            </h2>
            
            {/* 선택지 */}
            <div className="space-y-3">
              {currentQuestion.choices.map((choice, index) => (
                <label
                  key={choice.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === choice.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={choice.id}
                    checked={answers[currentQuestion.id] === choice.id}
                    onChange={() => handleAnswerSelect(currentQuestion.id, choice.id)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    answers[currentQuestion.id] === choice.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion.id] === choice.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{choice.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5개 그룹 네비게이션 */}
          <div className="flex justify-center items-center space-x-4">
            {/* 이전 그룹 버튼 */}
            <button
              onClick={goToPreviousGroup}
              disabled={currentGroup === 0}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>

            {/* 현재 그룹의 문제 번호들 */}
            <div className="flex space-x-2">
              {getVisibleQuestions().map((questionIdx) => (
                <button
                  key={questionIdx}
                  onClick={() => setCurrentQuestionIndex(questionIdx)}
                  className={`w-10 h-10 text-sm font-medium transition-all ${
                    questionIdx === currentQuestionIndex
                      ? 'bg-blue-600 text-white rounded-full border-2 border-blue-800'
                      : answers[examData.questions[questionIdx].id]
                      ? 'bg-green-100 text-green-700 rounded-full'
                      : 'bg-gray-100 text-gray-600 rounded-full'
                  }`}
                >
                  {questionIdx + 1}
                </button>
              ))}
            </div>

            {/* 다음 그룹 버튼 */}
            <button
              onClick={goToNextGroup}
              disabled={currentGroup >= totalGroups - 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>

          {/* 하단 다음 문제 버튼 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex >= totalQuestions - 1}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 문제 →
            </button>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-8 text-center">
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || submitMutation.isPending || answeredCount !== totalQuestions}
              className="bg-red-600 text-white py-3 px-8 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || submitMutation.isPending ? '제출 중...' : (answeredCount === totalQuestions ? '시험 제출하기' : '모든 문항을 답변해 주세요')}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              제출 후에는 답안을 수정할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




