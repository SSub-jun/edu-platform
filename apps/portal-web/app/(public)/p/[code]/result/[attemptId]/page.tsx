'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const attemptId = params.attemptId as string

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: async () => {
      const response = await apiClient.get(`/portal/attempts/${attemptId}/result`)
      return response.data
    },
    enabled: !!attemptId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-6">결과를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const isPassed = result.passed
  const score = result.score || 0
  const correctCount = result.answers?.filter((answer: any) => {
    const question = result.answers?.find((a: any) => a.questionId === answer.questionId)
    return question?.question?.answerId === answer.choiceId
  }).length || 0
  const totalCount = result.answers?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* 결과 아이콘 */}
          <div className={`text-8xl mb-6 ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
            {isPassed ? '🎉' : '😞'}
          </div>

          {/* 결과 제목 */}
          <h1 className={`text-3xl font-bold mb-4 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {isPassed ? '축하합니다!' : '아쉽습니다'}
          </h1>

          <h2 className="text-xl text-gray-700 mb-8">
            {isPassed ? '시험에 합격하셨습니다!' : '시험에 불합격하셨습니다.'}
          </h2>

          {/* 점수 표시 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className={`text-6xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {score}
              </div>
              <div className="ml-4 text-left">
                <div className="text-2xl font-semibold text-gray-900">점</div>
                <div className="text-sm text-gray-600">100점 만점</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                isPassed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isPassed ? '합격' : '불합격'} (60점 이상 합격)
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{correctCount}</div>
              <div className="text-sm text-blue-800">정답 수</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{totalCount}</div>
              <div className="text-sm text-gray-800">총 문항 수</div>
            </div>
          </div>

          {/* 참가자 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">시험 정보</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>참가자:</span>
                <span className="font-medium">{result.participant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>PIN:</span>
                <span className="font-mono">{result.participant?.pin4}</span>
              </div>
              <div className="flex justify-between">
                <span>시험 시작:</span>
                <span>{new Date(result.startedAt).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span>제출 시간:</span>
                <span>{result.submittedAt ? new Date(result.submittedAt).toLocaleString('ko-KR') : '-'}</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-4">
            {isPassed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  🎊 시험에 합격하셨습니다! 수고하셨습니다.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  💪 아쉽지만 다음에는 더 좋은 결과를 기대합니다!
                </p>
              </div>
            )}

            <button
              onClick={() => {
                // 로컬 스토리지 정리
                localStorage.removeItem('portal_token')
                localStorage.removeItem('portal_participant')
                localStorage.removeItem('portal_exam_data')
                router.push('/')
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}





