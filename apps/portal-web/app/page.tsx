"use client"

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [form, setForm] = useState({ code: '', name: '', pin4: '' })
  const [error, setError] = useState('')

  const [magicValues, setMagicValues] = useState({ code: 'KIST', name: '관리자', pin: '2017' })

  useEffect(() => {
    // 클라이언트에서만 환경변수 읽기 (Hydration 문제 해결)
    setMagicValues({
      code: process.env.NEXT_PUBLIC_PORTAL_ADMIN_MAGIC_CODE || 'KIST',
      name: process.env.NEXT_PUBLIC_PORTAL_ADMIN_MAGIC_NAME || '관리자',
      pin: process.env.NEXT_PUBLIC_PORTAL_ADMIN_MAGIC_PIN || '2017'
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'pin4') {
      const v = value.replace(/\D/g, '').slice(0, 4)
      setForm(prev => ({ ...prev, pin4: v }))
    } else if (name === 'code') {
      setForm(prev => ({ ...prev, code: value.toUpperCase().replace(/\s+/g, '') }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = form.code.trim().toUpperCase()
    const name = form.name.trim()
    const pin4 = form.pin4

    if (!code) {
      setError('세션 코드를 입력하세요.')
      return
    }
    if (!name) {
      setError('이름을 입력하세요.')
      return
    }
    if (!/^\d{4}$/.test(pin4)) {
      setError('PIN은 4자리 숫자여야 합니다.')
      return
    }

    // 관리자 매직 진입
    console.log('매직 체크:', { input: { code, name, pin4 }, magic: magicValues })
    if (code === magicValues.code && name === magicValues.name && pin4 === magicValues.pin) {
      console.log('매직 로그인 시도...')
      // 서버 매직 로그인 호출 → 토큰 저장 → 세션 목록 이동
      apiClient.post('/admin/magic-login', { code, name, pin4 })
        .then((res) => {
          console.log('매직 로그인 성공:', res.data)
          localStorage.setItem('portal_admin_token', res.data.access_token)
          router.push('/admin/sessions')
        })
        .catch((err) => {
          console.error('매직 로그인 실패:', err)
          setError('관리자 인증 실패')
        })
      return
    }

    // 수험자 플로우로 이동 (프리필 & 자동 진행)
    const params = new URLSearchParams({ name, pin4, auto: '1' })
    router.push(`/p/${code}/join?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시험 참여</h1>
          <p className="text-gray-600">세션 코드와 이름, PIN을 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">세션 코드</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="예: SAMPLE01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">4자리 PIN</label>
            <input
              type="text"
              name="pin4"
              value={form.pin4}
              onChange={handleChange}
              placeholder="0000"
              maxLength={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold">시작하기</button>
        </form>
      </div>
    </main>
  )
}




