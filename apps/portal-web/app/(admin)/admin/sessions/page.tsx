'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { PortalExamSession } from '@/lib/types'

export default function SessionsPage() {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    mode: 'RANDOM' as 'RANDOM',
    questionCount: 20,
    bankId: ''
  })

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 인증 확인
  useEffect(() => {
    if (!mounted) return
    const token = localStorage.getItem('portal_admin_token')
    if (!token) {
      router.push('/')
    }
  }, [router, mounted])

  // 세션 목록 조회
  const { data: sessions, refetch } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/sessions')
      return response.data as PortalExamSession[]
    },
  })

  // 문제은행 목록 조회
  const { data: banks } = useQuery({
    queryKey: ['admin-banks'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/banks')
      return response.data
    },
  })

  // 최근 선택한 문제은행 기본값 설정
  useEffect(() => {
    if (!mounted || !banks || createForm.bankId) return
    const last = localStorage.getItem('portal_last_bank_id')
    const initial = (banks.find((b: any) => b.id === last) || banks[0])?.id || ''
    if (initial) setCreateForm(prev => ({ ...prev, bankId: initial }))
  }, [banks, mounted])

  // 세션 생성
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/sessions', data)
      return response.data
    },
    onSuccess: () => {
      setShowCreateModal(false)
      setCreateForm({
        title: '',
        mode: 'RANDOM',
        questionCount: 20,
        bankId: ''
      })
      refetch()
    }
  })

  // 세션 퍼블리시
  const publishMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.patch(`/admin/sessions/${sessionId}/publish`)
      return response.data
    },
    onSuccess: () => {
      refetch()
    }
  })

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault()
    // 세션 번호는 자동 부여: 목록 최대 + 1
    const nextSessionNo = (sessions && sessions.length > 0)
      ? Math.max(...sessions.map(s => (s as any).sessionNo || 0)) + 1
      : 1
    createSessionMutation.mutate({
      title: createForm.title,
      sessionNo: nextSessionNo,
      mode: 'RANDOM',
      questionCount: createForm.questionCount,
      bankId: createForm.bankId,
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('portal_admin_token')
    router.push('/')
  }

  const handleDownloadCSV = async (sessionId: string) => {
    try {
      const response = await apiClient.get(`/admin/sessions/${sessionId}/results.csv`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `session-${sessionId}-results.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('CSV 다운로드 실패:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">시험 관리</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                새 시험 생성
              </button>
              <button
                onClick={() => router.push('/admin/banks')}
                className="px-4 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"
              >
                문제은행
              </button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800 transition-colors shadow-sm">로그아웃</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 세션 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">시험 목록</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    시험 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    모드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    문항 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    제한시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    참가자
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions?.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => router.push(`/admin/sessions/${session.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          코드: <span className="font-mono">{session.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.mode === 'RANDOM' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {session.mode === 'RANDOM' ? '랜덤' : '수동'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.questionCount}문항
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      30분
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const isClosed = !!session.closedAt
                        const isOngoing = session.isPublished && !isClosed
                        const isDraft = !session.isPublished && !isClosed
                        const label = isOngoing ? '진행중' : isClosed ? '종료' : '공개 전'
                        const cls = isOngoing
                          ? 'bg-green-100 text-green-800'
                          : isClosed
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
                            {label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session._count?.participants || 0}명
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 세션 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 시험 생성</h3>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시험 제목</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 세션 번호 입력 제거: 내부에서 자동 부여 */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">선택 모드</label>
                <input type="text" value="랜덤 출제" readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  출제 문항 수
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={createForm.questionCount}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제한시간
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  30분 (고정)
                </div>
                <p className="text-xs text-gray-500 mt-1">모든 시험은 30분으로 고정됩니다</p>
              </div>

              {createForm.mode === 'RANDOM' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제은행
                  </label>
                  <select
                    value={createForm.bankId}
                    onChange={(e) => { localStorage.setItem('portal_last_bank_id', e.target.value); setCreateForm(prev => ({ ...prev, bankId: e.target.value })) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline:none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">문제은행 선택</option>
                    {banks?.map((bank: any) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.title} ({bank._count?.questions || 0}문항)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createSessionMutation.isPending ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}




