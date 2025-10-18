'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const search = useSearchParams()
  const code = params.code as string
  
  const [formData, setFormData] = useState({
    name: '',
    pin4: ''
  })
  const [error, setError] = useState<string>('')

  const joinMutation = useMutation({
    mutationFn: async (data: { name: string; pin4: string }) => {
      // 먼저 세션 정보를 가져와서 sessionId를 얻어야 함
      const sessionResponse = await apiClient.get(`/portal/sessions/${code}`)
      const session = sessionResponse.data
      
      const response = await apiClient.post(`/portal/sessions/${session.id}/join`, data)
      return response.data
    },
    onSuccess: (data) => {
      // 토큰 저장
      localStorage.setItem('portal_token', data.access_token)
      localStorage.setItem('portal_participant', JSON.stringify(data.participant))
      
      // 시험 시작 페이지로 이동
      router.push(`/p/${code}/start`)
    },
    onError: (err: any) => {
      const status = err.response?.status
      const message = err.response?.data?.message
      if (status === 404) {
        setError('세션 코드를 찾을 수 없습니다. 코드를 다시 확인해주세요.')
      } else if (status === 409) {
        setError('이미 사용 중인 PIN입니다. 다른 PIN을 입력해주세요.')
      } else if (status === 400) {
        if (message === 'Session is not published') {
          setError('아직 공개되지 않은 세션입니다. 관리자에게 문의하세요.')
        } else {
          setError('요청이 올바르지 않습니다. 입력값을 확인해주세요.')
        }
      } else {
        setError('참여 처리 중 오류가 발생했습니다.')
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!code || typeof code !== 'string') {
      setError('세션 코드가 유효하지 않습니다.')
      return
    }
    
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    
    if (!formData.pin4.match(/^\d{4}$/)) {
      setError('PIN은 4자리 숫자여야 합니다.')
      return
    }
    
    joinMutation.mutate(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'pin4') {
      // 숫자만 입력 허용, 최대 4자리
      const numericValue = value.replace(/\D/g, '').slice(0, 4)
      setFormData(prev => ({ ...prev, [name]: numericValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // 쿼리 파라미터 프리필 & 자동 진행
  useEffect(() => {
    const name = search.get('name') || ''
    const pin4 = (search.get('pin4') || '').replace(/\D/g, '').slice(0, 4)
    const auto = search.get('auto') === '1'

    if (name || pin4) {
      setFormData(prev => ({ ...prev, name, pin4 }))
      if (auto && name && /^\d{4}$/.test(pin4)) {
        joinMutation.mutate({ name, pin4 })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            시험 참여
          </h1>
          <p className="text-gray-600">
            세션 코드: <span className="font-mono font-bold">{code}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label htmlFor="pin4" className="block text-sm font-medium text-gray-700 mb-2">
              4자리 PIN
            </label>
            <input
              type="text"
              id="pin4"
              name="pin4"
              value={formData.pin4}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
              placeholder="0000"
              maxLength={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              숫자 4자리를 입력하세요 (예: 1234)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={joinMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joinMutation.isPending ? '처리 중...' : '시험 시작하기'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← 이전으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}




