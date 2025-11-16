'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../lib/auth';

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

export default function AdminQnaPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<QnaPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [filter, setFilter] = useState<'all' | 'unanswered'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await authClient.getApi().get('/qna/posts');
      if (Array.isArray(response.data)) {
        setPosts(response.data);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('[ADMIN][QNA] Q&A 목록 조회 실패:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyBody.trim()) return;

    try {
      await authClient.getApi().post('/qna/replies', {
        postId: replyingTo,
        body: replyBody.trim(),
      });

      alert('답변이 등록되었습니다.');
      setReplyBody('');
      setReplyingTo(null);
      fetchPosts();
    } catch (error) {
      console.error('[ADMIN][QNA] 답변 등록 실패:', error);
      alert('답변 등록에 실패했습니다.');
    }
  };

  const handleDeletePost = async (postId: string, title: string) => {
    if (!confirm(`"${title}" 질문을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/qna/posts/${postId}`);
      alert('질문이 삭제되었습니다.');
      fetchPosts();
    } catch (error) {
      console.error('[ADMIN][QNA] 질문 삭제 실패:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('이 답변을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await authClient.getApi().delete(`/qna/replies/${replyId}`);
      alert('답변이 삭제되었습니다.');
      fetchPosts();
    } catch (error) {
      console.error('[ADMIN][QNA] 답변 삭제 실패:', error);
      alert('답변 삭제에 실패했습니다.');
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return '학생';
      case 'instructor': return '강사';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return '#17a2b8';
      case 'instructor': return '#28a745';
      case 'admin': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 필터링 및 검색
  const filteredPosts = posts.filter(post => {
    // 필터 적용
    if (filter === 'unanswered' && post.replies.length > 0) {
      return false;
    }

    // 검색어 적용
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        post.title.toLowerCase().includes(term) ||
        post.body.toLowerCase().includes(term) ||
        post.user.username.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const unansweredCount = posts.filter(p => p.replies.length === 0).length;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← 관리자 대시보드
            </button>
            
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#333',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                💭 Q&A 관리
              </h1>
              <p style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>
                모든 질문과 답변을 관리할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/admin/qna/analytics')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📊 통계 보기
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '25px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === 'all' ? '#0070f3' : '#f8f9fa',
                color: filter === 'all' ? 'white' : '#333',
                border: '1px solid',
                borderColor: filter === 'all' ? '#0070f3' : '#e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              전체 ({posts.length})
            </button>
            <button
              onClick={() => setFilter('unanswered')}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === 'unanswered' ? '#dc3545' : '#f8f9fa',
                color: filter === 'unanswered' ? 'white' : '#333',
                border: '1px solid',
                borderColor: filter === 'unanswered' ? '#dc3545' : '#e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              미답변 ({unansweredCount})
            </button>
          </div>

          <input
            type="text"
            placeholder="제목, 내용, 작성자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0070f3'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* Q&A 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              color: '#666',
              fontSize: '16px'
            }}>
              로딩 중...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              color: '#666',
              fontSize: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {searchTerm ? '검색 결과가 없습니다.' : '아직 질문이 없습니다.'}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  backgroundColor: '#fafafa',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* 질문 */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    marginBottom: '12px',
                    gap: '15px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        {post.title}
                        {post.replies.length === 0 && (
                          <span style={{
                            marginLeft: '10px',
                            fontSize: '12px',
                            color: '#dc3545',
                            backgroundColor: '#f8d7da',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 'normal'
                          }}>
                            미답변
                          </span>
                        )}
                      </h3>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        <span style={{
                          color: 'white',
                          backgroundColor: getRoleColor(post.user.role),
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {getRoleDisplayName(post.user.role)}
                        </span>
                        <span>{post.user.username}</span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePost(post.id, post.title)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>

                  <p style={{ 
                    margin: 0, 
                    lineHeight: '1.6',
                    color: '#555',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {post.body}
                  </p>
                </div>

                {/* 답변 목록 */}
                {post.replies.length > 0 && (
                  <div style={{ 
                    marginLeft: '20px',
                    paddingLeft: '20px',
                    borderLeft: '3px solid #e0e0e0',
                    marginBottom: '15px'
                  }}>
                    {post.replies.map((reply) => (
                      <div 
                        key={reply.id}
                        style={{
                          marginBottom: '12px',
                          padding: '12px',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            color: '#666'
                          }}>
                            <span style={{
                              color: 'white',
                              backgroundColor: getRoleColor(reply.user.role),
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '500'
                            }}>
                              {getRoleDisplayName(reply.user.role)}
                            </span>
                            <span>{reply.user.username}</span>
                            <span>•</span>
                            <span>{formatDate(reply.createdAt)}</span>
                          </div>

                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <p style={{ 
                          margin: 0,
                          color: '#333',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 답변 작성 폼 */}
                <div style={{ marginTop: '15px' }}>
                  {replyingTo === post.id ? (
                    <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <textarea
                        placeholder="답변을 입력하세요..."
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="submit"
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          답변 등록
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyBody('');
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(post.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      💬 답변하기
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

