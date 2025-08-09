'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface QnaPost {
  id: string;
  subjectId: string;
  lessonId?: string;
  title: string;
  body: string;
}

export default function QnaPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState<QnaPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 폼 상태
  const [subjectId, setSubjectId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  
  // 필터 상태
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterLessonId, setFilterLessonId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    fetchPosts();
  }, [router]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSubjectId) params.append('subjectId', filterSubjectId);
      if (filterLessonId) params.append('lessonId', filterLessonId);

      const response = await fetch(`http://localhost:4000/qna/posts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Q&A 목록 조회 실패');
      }

      const data = await response.json();
      setPosts(data.items || []);
    } catch (error) {
      alert('Q&A 목록을 불러올 수 없습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title || !body) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:4000/qna/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          subjectId,
          lessonId: lessonId || undefined,
          title,
          body,
        }),
      });

      if (!response.ok) {
        throw new Error('Q&A 등록 실패');
      }

      const newPost = await response.json();
      setPosts(prev => [newPost, ...prev]);
      
      // 폼 초기화
      setSubjectId('');
      setLessonId('');
      setTitle('');
      setBody('');
      setShowForm(false);
      
      alert('Q&A가 등록되었습니다.');
    } catch (error) {
      alert('Q&A 등록 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            Q&A
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showForm ? '닫기' : '질문하기'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 질문 등록 폼 */}
        {showForm && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              marginBottom: '20px',
              color: '#333'
            }}>
              새 질문 등록
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    과목 ID *
                  </label>
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    placeholder="예: math, science"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    레슨 ID (선택)
                  </label>
                  <input
                    type="text"
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    placeholder="예: lesson-1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="질문 제목을 입력하세요"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  내용 *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="질문 내용을 자세히 입력하세요"
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? '등록 중...' : '질문 등록'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 필터 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            marginBottom: '15px',
            color: '#333'
          }}>
            필터
          </h3>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                color: '#666'
              }}>
                과목 ID
              </label>
              <input
                type="text"
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                placeholder="과목으로 필터"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '150px'
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                color: '#666'
              }}>
                레슨 ID
              </label>
              <input
                type="text"
                value={filterLessonId}
                onChange={(e) => setFilterLessonId(e.target.value)}
                placeholder="레슨으로 필터"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '150px'
                }}
              />
            </div>
            <button
              onClick={fetchPosts}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              필터 적용
            </button>
          </div>
        </div>

        {/* Q&A 목록 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              color: '#333'
            }}>
              질문 목록
            </h2>
            <button
              onClick={fetchPosts}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              새로고침
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              로딩 중...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              등록된 질문이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {posts.map((post) => (
                <div key={post.id} style={{
                  padding: '20px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: '#333',
                      margin: '0'
                    }}>
                      {post.title}
                    </h3>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      backgroundColor: '#e9ecef',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {post.subjectId}
                      {post.lessonId && ` / ${post.lessonId}`}
                    </div>
                  </div>
                  <p style={{ 
                    color: '#666',
                    lineHeight: '1.6',
                    margin: '0'
                  }}>
                    {post.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
