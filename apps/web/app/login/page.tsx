'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      alert('ID와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
      });

      if (!response.ok) {
        throw new Error('로그인 실패');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      
      // role에 따라 다른 페이지로 리다이렉트
      switch (data.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'instructor':
          router.push('/instructor');
          break;
        case 'student':
          router.push('/student');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      alert('로그인 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px',
        padding: '40px 20px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: 'white'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          로그인
        </h1>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              disabled={loading}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          <p>테스트 계정:</p>
          <p>admin / admin123 (관리자)</p>
          <p>teacher / teach123 (강사)</p>
          <p>user / user123 (학생)</p>
        </div>
      </div>
    </div>
  );
}
