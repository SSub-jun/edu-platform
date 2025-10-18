'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [showAssigned, setShowAssigned] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const token = localStorage.getItem('portal_admin_token')
    if (!token) router.push('/')
  }, [router, mounted])

  const { data: session, refetch, isLoading, isError } = useQuery({
    queryKey: ['admin-session-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/sessions/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  // RANDOM 모드일 때 문제은행 상세 조회 (출제 미리보기용)
  const { data: bankDetail } = useQuery({
    queryKey: ['admin-bank-detail-for-session', session?.bank?.id],
    queryFn: async () => {
      if (!session?.bank?.id) return null
      const res = await apiClient.get(`/admin/banks/${session.bank.id}`)
      return res.data
    },
    enabled: !!session?.bank?.id && session?.mode === 'RANDOM',
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/admin/sessions/${id}/publish`)
      return res.data
    },
    onSuccess: () => {
      refetch()
    }
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/admin/sessions/${id}/close`)
      return res.data
    },
    onSuccess: () => {
      refetch()
    }
  })

  if (isLoading) return <div className="p-8 text-gray-600">로딩 중…</div>
  if (isError || !session) return <div className="p-8 text-red-600">세션을 불러올 수 없습니다.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <button onClick={() => router.push('/admin/sessions')} aria-label="뒤로 가기" className="px-3 py-2 border rounded text-sm bg-white hover:bg-gray-50 flex items-center gap-2">
              <span className="inline-block">←</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">세션 상세</h1>
              <p className="text-gray-600">{session.title}</p>
            </div>
          </div>
          <div className="space-x-2">
            {!session.isPublished && (
              <button
                onClick={() => publishMutation.mutate()}
                className="px-4 py-2 bg-green-600 text-white rounded"
                disabled={publishMutation.isPending}
              >{publishMutation.isPending ? '공개 중…' : '공개'}</button>
            )}
            {session.isPublished && (
              <button
                onClick={() => closeMutation.mutate()}
                className="px-4 py-2 bg-red-600 text-white rounded"
                disabled={closeMutation.isPending}
              >{closeMutation.isPending ? '종료 중…' : '종료'}</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-3">세션 정보</h2>
            <div className="text-sm text-gray-800 space-y-1">
              <div>코드: <span className="font-mono">{session.code}</span></div>
              <div>모드: {session.mode}</div>
              <div>문항 수: {session.questionCount}</div>
              <div>상태: {session.isPublished ? '진행' : '비공개'}</div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowAssigned(prev => !prev)}
                className="px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 text-sm"
              >
                {showAssigned ? '출제 문제 닫기' : '출제 문제 보기'}
              </button>
            </div>
          </div>

          {showAssigned && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-3">출제 문제 목록</h2>
              {session.mode === 'MANUAL' ? (
                <ul className="list-disc pl-6 space-y-1 text-gray-800">
                  {session.questions.map((sq: any) => (
                    <li key={sq.id}>{sq.orderIndex + 1}. {sq.question?.stem}</li>
                  ))}
                </ul>
              ) : (
                <ul className="list-disc pl-6 space-y-1 text-gray-800">
                  {(() => {
                    const list = (bankDetail?.questions || []).slice(0, session.questionCount)
                    return list.map((q: any, idx: number) => (
                      <li key={q.id}>{idx + 1}. {q.stem}</li>
                    ))
                  })()}
                </ul>
              )}
              {session.mode === 'RANDOM' && (
                <p className="text-xs text-gray-500 mt-3">랜덤 모드: 실제 응시 시점에 보기 순서가 섞일 수 있습니다.</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="font-semibold mb-4">응시 결과</h2>
            <FlatResultsTable sessionId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}

function FlatResultsTable({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-session-results', sessionId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/sessions/${sessionId}/results`)
      return res.data as Array<any>
    },
    enabled: !!sessionId,
  })

  if (isLoading) return <div className="text-gray-600">불러오는 중…</div>
  if (isError) return <div className="text-red-600">결과를 불러올 수 없습니다.</div>
  if (!data || data.length === 0) return <div className="text-gray-600">아직 제출된 결과가 없습니다.</div>

  const maxAnswers = Math.max(...data.map((a: any) => a.answers?.length || 0))
  const headerNumbers = Array.from({ length: maxAnswers }, (_, i) => i + 1)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">점수</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">합격</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제출 시각</th>
            {headerNumbers.map(n => (
              <th key={n} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((attempt: any) => {
            const sortedAnswers = [...(attempt.answers || [])]
              .sort((a, b) => (a.question?.stem || '').localeCompare(b.question?.stem || ''))
            return (
              <tr key={attempt.id}>
                <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">{attempt.participant?.name}</td>
                <td className="px-2 py-2 font-mono text-sm text-gray-900 whitespace-nowrap">{attempt.participant?.pin4}</td>
                <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">{attempt.score ?? '-'}</td>
                <td className={"px-2 py-2 text-sm whitespace-nowrap " + (attempt.passed ? 'text-green-700' : 'text-red-700')}>{attempt.passed ? '합격' : '불합격'}</td>
                <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('ko-KR') : '-'}</td>
                {headerNumbers.map((n, idx) => {
                  const ans = sortedAnswers[idx]
                  if (!ans) return <td key={n} className="px-2 py-2 text-center text-xs text-gray-400">-</td>
                  const isCorrect = ans.choiceId === ans.question?.answerId
                  const labelIndex = (ans.question?.choices || []).findIndex((c: any) => c.id === ans.choiceId)
                  const display = labelIndex >= 0 ? String.fromCharCode(65 + labelIndex) : '?'
                  return (
                    <td key={n} className={`px-2 py-2 text-center text-sm font-semibold ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{display}</td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}



