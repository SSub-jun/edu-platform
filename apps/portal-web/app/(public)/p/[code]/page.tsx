'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { PortalExamSession } from '@/lib/types'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [error, setError] = useState<string>('')

  const { data: session, isLoading, error: queryError } = useQuery({
    queryKey: ['session', code],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/portal/sessions/${code}`)
        return response.data as PortalExamSession
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('세션을 찾을 수 없습니다.')
        } else {
          setError('세션 정보를 불러오는데 실패했습니다.')
        }
        throw err
      }
    },
    enabled: !!code,
  })

  const handleJoin = () => {
    if (session) {
      router.push(`/p/${code}/join`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">세션 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || queryError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {session.title}
          </h1>
          <p className="text-gray-600 mb-6">
            시험 세션에 참여하시겠습니까?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">시험 정보</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>세션 코드:</span>
                <span className="font-mono font-bold">{session.code}</span>
              </div>
              <div className="flex justify-between">
                <span>출제 문항:</span>
                <span>{session.questionCount}문항</span>
              </div>
              <div className="flex justify-between">
                <span>선택 모드:</span>
                <span>{session.mode === 'RANDOM' ? '랜덤 출제' : '수동 선택'}</span>
              </div>
              <div className="flex justify-between">
                <span>합격 기준:</span>
                <span>70점 이상</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleJoin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            시험 참여하기
          </button>
        </div>
      </div>
    </div>
  )
}





