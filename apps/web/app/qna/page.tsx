'use client';

export const dynamic = 'force-dynamic';

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
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT token format');
          }
          const payload = JSON.parse(atob(tokenParts[1]!));
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/qna/posts`, {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/qna/posts`, {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/qna/replies`, {
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
    <div className="min-h-screen p-6 bg-bg-primary">
      <div className="max-w-4xl mx-auto">
        {/* 상단 영역: 간단한 타이틀 + 질문하기 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            Q&A
          </h1>
          {userRole === 'student' && (
            <button
              onClick={() => setShowQuestionForm(!showQuestionForm)}
              className="px-5 py-2.5 bg-info text-white border-0 rounded-md cursor-pointer font-medium transition-colors hover:bg-info/90"
            >
              {showQuestionForm ? '취소' : '질문하기'}
            </button>
          )}
        </div>

        {/* 질문 작성 폼 (학생만) */}
        {showQuestionForm && userRole === 'student' && (
          <div className="bg-surface p-6 rounded-xl mb-6 border border-border">
            <h3 className="m-0 mb-5 text-text-primary text-lg font-semibold">
              새 질문 작성
            </h3>
            <form onSubmit={handleQuestionSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="질문 제목을 입력하세요"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                required
              />
              <textarea
                placeholder="질문 내용을 자세히 적어주세요"
                value={questionBody}
                onChange={(e) => setQuestionBody(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-lg text-base text-text-primary placeholder:text-text-tertiary resize-y outline-none transition-all leading-normal focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-success text-white border-0 rounded-lg cursor-pointer text-base font-semibold transition-colors hover:bg-success/90 self-start"
              >
                질문 등록
              </button>
            </form>
          </div>
        )}

        {/* Q&A 목록 */}
        <div className="flex flex-col gap-5">
          {loading ? (
            <div className="text-center py-10 bg-surface border border-border rounded-xl">
              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <div className="w-5 h-5 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin"></div>
                로딩 중...
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 bg-surface border border-border rounded-xl text-text-secondary">
              아직 질문이 없습니다.
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-surface p-5 rounded-xl border border-border"
              >
                {/* 질문 */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2.5 gap-4">
                    <h3 className="m-0 text-lg text-text-primary font-bold flex-1">
                      {post.title}
                    </h3>
                    <div className="text-xs text-text-tertiary whitespace-nowrap">
                      {post.user.username} ({post.user.role === 'student' ? '학생' : '강사'}) | {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p className="m-0 leading-relaxed text-text-secondary">
                    {post.body}
                  </p>
                </div>

                {/* 답변 목록 */}
                {post.replies.length > 0 && (
                  <div className="ml-5 border-l-2 border-border pl-4">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="mb-2.5">
                        <div className="text-xs text-text-tertiary mb-1">
                          {reply.user.username} ({reply.user.role === 'instructor' ? '강사' : '학생'}) | {new Date(reply.createdAt).toLocaleString()}
                        </div>
                        <p className="m-0 text-text-secondary">
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 답변 작성 (강사만) */}
                {userRole === 'instructor' && (
                  <div className="mt-4">
                    {replyingTo === post.id ? (
                      <form onSubmit={handleReplySubmit} className="flex gap-2.5">
                        <input
                          type="text"
                          placeholder="답변을 입력하세요"
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-success text-white border-0 rounded-md cursor-pointer font-medium transition-colors hover:bg-success/90"
                        >
                          답변
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-4 py-2 bg-bg-primary text-text-secondary border border-border rounded-md cursor-pointer font-medium transition-all hover:bg-surface hover:text-text-primary hover:border-border-light"
                        >
                          취소
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(post.id)}
                        className="px-3 py-1.5 bg-info text-white border-0 rounded-md cursor-pointer text-xs font-medium transition-colors hover:bg-info/90"
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