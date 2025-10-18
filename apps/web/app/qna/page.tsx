'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../hooks/useAuthGuard';

interface QnaPost {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  user: {
    username: string;
    role: string;
  };
  replies: {
    id: string;
    body: string;
    createdAt: string;
    user: {
      username: string;
      role: string;
    };
  }[];
}

export default function QnaPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthGuard();
  const [posts, setPosts] = useState<QnaPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // 질문 폼 상태
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionBody, setQuestionBody] = useState('');
  
  // 답변 폼 상태
  const [replyBody, setReplyBody] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      // JWT 토큰에서 사용자 role 가져오기
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserRole(payload.role);
        } catch (e) {
          console.error('토큰 파싱 실패:', e);
        }
      }
      fetchPosts();
    }
  }, [isAuthenticated]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/qna/posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Q&A 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionTitle.trim() || !questionBody.trim()) return;

    try {
      const response = await fetch('http://localhost:4000/qna/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          title: questionTitle,
          body: questionBody,
        }),
      });

      if (response.ok) {
        setQuestionTitle('');
        setQuestionBody('');
        setShowQuestionForm(false);
        fetchPosts();
      }
    } catch (error) {
      alert('질문 등록에 실패했습니다.');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyBody.trim()) return;

    try {
      const response = await fetch('http://localhost:4000/qna/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          postId: replyingTo,
          body: replyBody,
        }),
      });

      if (response.ok) {
        setReplyBody('');
        setReplyingTo(null);
        fetchPosts();
      }
    } catch (error) {
      alert('답변 등록에 실패했습니다.');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => {
                // role에 따라 다른 페이지로 이동
                if (userRole === 'instructor') {
                  router.push('/instructor');
                } else if (userRole === 'admin') {
                  router.push('/admin');
                } else {
                  router.push('/curriculum');
                }
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {userRole === 'instructor' ? '← 강사 대시보드' : 
               userRole === 'admin' ? '← 관리자 대시보드' : 
               '← 커리큘럼'}
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#000' }}>
              Q&A
            </h1>
          </div>
          <div>
            {userRole === 'student' && (
              <button
                onClick={() => setShowQuestionForm(!showQuestionForm)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {showQuestionForm ? '취소' : '질문하기'}
              </button>
            )}
          </div>
        </div>

        {/* 질문 작성 폼 (학생만) */}
        {showQuestionForm && userRole === 'student' && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1f2937', 
              fontSize: '18px',
              fontWeight: '600'
            }}>
              새 질문 작성
            </h3>
            <form onSubmit={handleQuestionSubmit}>
              <input
                type="text"
                placeholder="질문 제목을 입력하세요"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb',
                  color: '#374151',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
              <textarea
                placeholder="질문 내용을 자세히 적어주세요"
                value={questionBody}
                onChange={(e) => setQuestionBody(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb',
                  color: '#374151',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                질문 등록
              </button>
            </form>
          </div>
        )}

        {/* Q&A 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              로딩 중...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px' }}>
              아직 질문이 없습니다.
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* 질문 */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      color: '#000', 
                      fontWeight: 'bold' 
                    }}>
                      {post.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {post.user.username} ({post.user.role === 'student' ? '학생' : '강사'}) | {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
                    {post.body}
                  </p>
                </div>

                {/* 답변 목록 */}
                {post.replies.length > 0 && (
                  <div style={{
                    marginLeft: '20px',
                    borderLeft: '3px solid #e9ecef',
                    paddingLeft: '15px'
                  }}>
                    {post.replies.map((reply) => (
                      <div key={reply.id} style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                          {reply.user.username} ({reply.user.role === 'instructor' ? '강사' : '학생'}) | {new Date(reply.createdAt).toLocaleString()}
                        </div>
                        <p style={{ margin: 0, color: '#555' }}>
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 답변 작성 (강사만) */}
                {userRole === 'instructor' && (
                  <div style={{ marginTop: '15px' }}>
                    {replyingTo === post.id ? (
                      <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="답변을 입력하세요"
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                          required
                        />
                        <button
                          type="submit"
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          답변
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          취소
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(post.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        답변하기
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}