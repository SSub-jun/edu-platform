'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export default function BanksPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showCreateBankModal, setShowCreateBankModal] = useState(false)
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState<any>(null)
  const [createBankForm, setCreateBankForm] = useState({ title: '' })
  const [createQuestionForm, setCreateQuestionForm] = useState({
    stem: '',
    choices: [{ label: '' }, { label: '' }, { label: '' }, { label: '' }],
    answerIndex: 0
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

  // 문제은행 목록 조회
  const { data: banks, refetch: refetchBanks } = useQuery({
    queryKey: ['admin-banks'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/banks')
      return response.data
    },
  })

  // 선택된 문제은행의 문제 목록 조회
  const { data: questions, refetch: refetchQuestions } = useQuery({
    queryKey: ['admin-bank-questions', selectedBank?.id],
    queryFn: async () => {
      if (!selectedBank) return []
      const response = await apiClient.get(`/admin/banks/${selectedBank.id}/questions`)
      return response.data
    },
    enabled: !!selectedBank,
  })

  // 문제은행 생성
  const createBankMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const response = await apiClient.post('/admin/banks', data)
      return response.data
    },
    onSuccess: () => {
      setShowCreateBankModal(false)
      setCreateBankForm({ title: '' })
      refetchBanks()
    }
  })

  // 문제 생성
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(`/admin/banks/${selectedBank.id}/questions`, data)
      return response.data
    },
    onSuccess: () => {
      setShowCreateQuestionModal(false)
      setCreateQuestionForm({
        stem: '',
        choices: [{ label: '' }, { label: '' }, { label: '' }, { label: '' }],
        answerIndex: 0
      })
      refetchQuestions()
    }
  })

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault()
    createBankMutation.mutate(createBankForm)
  }

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 빈 보기 제거
    const validChoices = createQuestionForm.choices.filter(choice => choice.label.trim())
    if (validChoices.length < 3) {
      alert('최소 3개의 보기가 필요합니다.')
      return
    }
    
    createQuestionMutation.mutate({
      stem: createQuestionForm.stem,
      choices: validChoices,
      answerIndex: createQuestionForm.answerIndex
    })
  }

  const handleChoiceChange = (index: number, value: string) => {
    setCreateQuestionForm(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index ? { ...choice, label: value } : choice
      )
    }))
  }

  const addChoice = () => {
    if (createQuestionForm.choices.length < 10) {
      setCreateQuestionForm(prev => ({
        ...prev,
        choices: [...prev.choices, { label: '' }]
      }))
    }
  }

  const removeChoice = (index: number) => {
    if (createQuestionForm.choices.length > 3) {
      setCreateQuestionForm(prev => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index),
        answerIndex: prev.answerIndex >= index ? Math.max(0, prev.answerIndex - 1) : prev.answerIndex
      }))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('portal_admin_token')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-start gap-3">
              <button
                onClick={() => router.push('/admin/sessions')}
                aria-label="뒤로 가기"
                className="px-3 py-2 border rounded text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="inline-block">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">문제은행 관리</h1>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateBankModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 문제은행 생성
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 문제은행 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">문제은행 목록</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {banks?.map((bank: any) => (
                <div
                  key={bank.id}
                  className={`p-6 cursor-pointer transition-colors ${
                    selectedBank?.id === bank.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedBank(bank)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{bank.title}</h3>
                      <p className="text-sm text-gray-500">
                        {bank._count?.questions || 0}개 문제
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(bank.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 문제은행의 문제 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedBank ? `${selectedBank.title} 문제 목록` : '문제은행을 선택하세요'}
              </h2>
              {selectedBank && (
                <button
                  onClick={() => setShowCreateQuestionModal(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  문제 추가
                </button>
              )}
            </div>
            
            {selectedBank ? (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {questions?.map((question: any, index: number) => (
                  <QuestionRow key={question.id} bankId={selectedBank.id} index={index} question={question} onChanged={refetchQuestions} />
                ))}
                {questions?.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    아직 문제가 없습니다. 문제를 추가해보세요.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                왼쪽에서 문제은행을 선택하세요.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 문제은행 생성 모달 */}
      {showCreateBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 문제은행 생성</h3>
            
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문제은행 제목
                </label>
                <input
                  type="text"
                  value={createBankForm.title}
                  onChange={(e) => setCreateBankForm({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateBankModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createBankMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createBankMutation.isPending ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 문제 생성 모달 */}
      {showCreateQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 문제 추가</h3>
            
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문제 내용
                </label>
                <textarea
                  value={createQuestionForm.stem}
                  onChange={(e) => setCreateQuestionForm(prev => ({ ...prev, stem: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    보기 목록
                  </label>
                  {createQuestionForm.choices.length < 10 && (
                    <button
                      type="button"
                      onClick={addChoice}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 보기 추가
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {createQuestionForm.choices.map((choice, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="answerIndex"
                        value={index}
                        checked={createQuestionForm.answerIndex === index}
                        onChange={(e) => setCreateQuestionForm(prev => ({ 
                          ...prev, 
                          answerIndex: parseInt(e.target.value) 
                        }))}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={choice.label}
                        onChange={(e) => handleChoiceChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`보기 ${index + 1}`}
                        required
                      />
                      {createQuestionForm.choices.length > 3 && (
                        <button
                          type="button"
                          onClick={() => removeChoice(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateQuestionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createQuestionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createQuestionMutation.isPending ? '추가 중...' : '문제 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionRow({ bankId, index, question, onChanged }: { bankId: string; index: number; question: any; onChanged: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<{ stem: string; choices: { label: string }[]; answerIndex: number }>(() => ({
    stem: question.stem,
    choices: question.choices?.map((c: any) => ({ label: c.label })) || [],
    answerIndex: Math.max(0, (question.choices || []).findIndex((c: any) => c.id === question.answerId)),
  }))

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/admin/banks/${bankId}/questions/${question.id}`, form)
      return res.data
    },
    onSuccess: () => {
      setIsEditing(false)
      onChanged()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/admin/banks/${bankId}/questions/${question.id}/delete`)
      return res.data
    },
    onSuccess: () => {
      onChanged()
    }
  })

  const addChoice = () => {
    if (form.choices.length < 10) setForm(prev => ({ ...prev, choices: [...prev.choices, { label: '' }] }))
  }
  const removeChoice = (i: number) => {
    if (form.choices.length > 3) setForm(prev => ({ ...prev, choices: prev.choices.filter((_, idx) => idx !== i), answerIndex: prev.answerIndex >= i ? Math.max(0, prev.answerIndex - 1) : prev.answerIndex }))
  }

  if (!isEditing) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-2">{index + 1}. {question.stem}</h4>
            <div className="space-y-1">
              {question.choices?.map((choice: any, choiceIndex: number) => (
                <div key={choice.id} className={`text-xs px-2 py-1 rounded ${choice.id === question.answerId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {String.fromCharCode(65 + choiceIndex)}. {choice.label}
                  {choice.id === question.answerId && ' ✓'}
                </div>
              ))}
            </div>
          </div>
          <div className="ml-4 space-x-2">
            <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 text-sm">수정</button>
            <button onClick={() => { if (confirm('이 문제를 삭제하시겠습니까?')) deleteMutation.mutate() }} className="text-red-600 hover:text-red-800 text-sm">삭제</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-50">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">문제</label>
          <textarea value={form.stem} onChange={(e) => setForm(prev => ({ ...prev, stem: e.target.value }))} className="w-full px-3 py-2 border rounded" rows={3} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-medium text-gray-600">보기</label>
            {form.choices.length < 10 && <button onClick={addChoice} className="text-blue-600 text-xs">+ 보기 추가</button>}
          </div>
          <div className="space-y-2">
            {form.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name={`answer-${question.id}`} checked={form.answerIndex === i} onChange={() => setForm(prev => ({ ...prev, answerIndex: i }))} className="text-blue-600" />
                <input type="text" value={c.label} onChange={(e) => setForm(prev => ({ ...prev, choices: prev.choices.map((cc, idx) => idx === i ? { label: e.target.value } : cc) }))} className="flex-1 px-3 py-2 border rounded" />
                {form.choices.length > 3 && <button onClick={() => removeChoice(i)} className="text-red-600 text-xs">삭제</button>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1 border rounded text-sm">취소</button>
          <button onClick={() => updateMutation.mutate()} className="px-3 py-1 bg-blue-600 text-white rounded text-sm" disabled={updateMutation.isPending}>{updateMutation.isPending ? '저장 중…' : '저장'}</button>
        </div>
      </div>
    </div>
  )
}





