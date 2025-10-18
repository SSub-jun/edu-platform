'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface QnaStats {
  totalPosts: number;
  totalReplies: number;
  unansweredPosts: number;
  recentPosts: Array<{
    id: string;
    title: string;
    user: {
      username: string;
      role: string;
    };
    repliesCount: number;
    createdAt: string;
  }>;
  topContributors: Array<{
    user: {
      username: string;
      role: string;
    };
    postsCount: number;
    repliesCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    posts: number;
    replies: number;
  }>;
}

export default function AdminQnaAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<QnaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // 최근 N일

  const loadQnaStats = async () => {
    try {
      // Q&A 게시글 목록을 가져와서 통계 계산
      const response = await authClient.getApi().get('/qna/posts');
      const posts = Array.isArray(response.data) ? response.data : [];

      // 통계 계산
      const totalPosts = posts.length;
      const totalReplies = posts.reduce((sum, post) => sum + (post.replies?.length || 0), 0);
      const unansweredPosts = posts.filter(post => !post.replies || post.replies.length === 0).length;

      // 최근 게시글 (답변 수와 함께)
      const recentPosts = posts
        .slice(0, 10)
        .map(post => ({
          id: post.id,
          title: post.title,
          user: post.user,
          repliesCount: post.replies?.length || 0,
          createdAt: post.createdAt
        }));

      // 기여도 분석 (게시글 + 답변)
      const contributorMap = new Map();
      
      // 게시글 작성자
      posts.forEach(post => {
        const key = post.user.username;
        if (!contributorMap.has(key)) {
          contributorMap.set(key, {
            user: post.user,
            postsCount: 0,
            repliesCount: 0
          });
        }
        contributorMap.get(key).postsCount++;
      });

      // 답변 작성자
      posts.forEach(post => {
        if (post.replies) {
          post.replies.forEach(reply => {
            const key = reply.user.username;
            if (!contributorMap.has(key)) {
              contributorMap.set(key, {
                user: reply.user,
                postsCount: 0,
                repliesCount: 0
              });
            }
            contributorMap.get(key).repliesCount++;
          });
        }
      });

      const topContributors = Array.from(contributorMap.values())
        .sort((a, b) => (b.postsCount + b.repliesCount) - (a.postsCount + a.repliesCount))
        .slice(0, 10);

      // 일별 통계 (최근 7일)
      const days = parseInt(timeRange);
      const dailyStats = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayPosts = posts.filter(post => {
          const postDate = new Date(post.createdAt).toISOString().split('T')[0];
          return postDate === dateStr;
        }).length;

        const dayReplies = posts.reduce((sum, post) => {
          if (post.replies) {
            return sum + post.replies.filter(reply => {
              const replyDate = new Date(reply.createdAt).toISOString().split('T')[0];
              return replyDate === dateStr;
            }).length;
          }
          return sum;
        }, 0);

        dailyStats.push({
          date: dateStr,
          posts: dayPosts,
          replies: dayReplies
        });
      }

      setStats({
        totalPosts,
        totalReplies,
        unansweredPosts,
        recentPosts,
        topContributors,
        dailyStats
      });
    } catch (error) {
      console.error('Q&A 통계 로드 실패:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
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

  useEffect(() => {
    loadQnaStats();
  }, [timeRange]);

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
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
            
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📊 Q&A 통계
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="7">최근 7일</option>
              <option value="14">최근 14일</option>
              <option value="30">최근 30일</option>
            </select>

            <button
              onClick={() => router.push('/qna')}
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
              💭 Q&A 관리
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px'
          }}>
            통계 로딩 중...
          </div>
        ) : !stats ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#dc3545',
            fontSize: '16px'
          }}>
            통계를 불러오는데 실패했습니다.
          </div>
        ) : (
          <div>
            {/* 전체 통계 카드 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{
                padding: '25px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3', marginBottom: '8px' }}>
                  {stats.totalPosts}
                </div>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                  총 질문 수
                </div>
              </div>

              <div style={{
                padding: '25px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', marginBottom: '8px' }}>
                  {stats.totalReplies}
                </div>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                  총 답변 수
                </div>
              </div>

              <div style={{
                padding: '25px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545', marginBottom: '8px' }}>
                  {stats.unansweredPosts}
                </div>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                  미답변 질문
                </div>
              </div>

              <div style={{
                padding: '25px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8', marginBottom: '8px' }}>
                  {stats.totalPosts > 0 ? Math.round((stats.totalReplies / stats.totalPosts) * 100) : 0}%
                </div>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                  답변률
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
              {/* 최근 질문 목록 */}
              <div>
                <h3 style={{ 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '20px'
                }}>
                  💬 최근 질문
                </h3>
                
                <div style={{ 
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}>
                  {stats.recentPosts.length === 0 ? (
                    <div style={{ 
                      padding: '20px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      질문이 없습니다.
                    </div>
                  ) : (
                    stats.recentPosts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: '#fafafa'
                        }}
                      >
                        <div style={{ 
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#333',
                          marginBottom: '6px',
                          lineHeight: '1.4'
                        }}>
                          {post.title}
                        </div>
                        
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              color: 'white',
                              backgroundColor: getRoleColor(post.user.role),
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '500'
                            }}>
                              {getRoleDisplayName(post.user.role)}
                            </span>
                            <span>{post.user.username}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              color: post.repliesCount > 0 ? '#28a745' : '#dc3545',
                              fontWeight: '500'
                            }}>
                              답변 {post.repliesCount}개
                            </span>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 활발한 참여자 */}
              <div>
                <h3 style={{ 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '20px'
                }}>
                  👥 활발한 참여자
                </h3>
                
                <div style={{ 
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}>
                  {stats.topContributors.length === 0 ? (
                    <div style={{ 
                      padding: '20px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      참여자가 없습니다.
                    </div>
                  ) : (
                    stats.topContributors.map((contributor, index) => (
                      <div
                        key={contributor.user.username}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: '#fafafa'
                        }}
                      >
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: index < 3 ? '#ffd700' : '#e9ecef',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: index < 3 ? '#333' : '#666'
                            }}>
                              {index + 1}
                            </div>
                            
                            <div>
                              <div style={{ 
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                {contributor.user.username}
                                <span style={{
                                  fontSize: '10px',
                                  color: 'white',
                                  backgroundColor: getRoleColor(contributor.user.role),
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  fontWeight: '500'
                                }}>
                                  {getRoleDisplayName(contributor.user.role)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
                            <div>질문 {contributor.postsCount}개</div>
                            <div>답변 {contributor.repliesCount}개</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 일별 활동 차트 */}
            <div>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px'
              }}>
                📈 일별 활동 ({timeRange}일간)
              </h3>
              
              <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: `repeat(${stats.dailyStats.length}, 1fr)`,
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  {stats.dailyStats.map((day, index) => {
                    const maxActivity = Math.max(...stats.dailyStats.map(d => d.posts + d.replies));
                    const activity = day.posts + day.replies;
                    const height = maxActivity > 0 ? Math.max((activity / maxActivity) * 100, 5) : 5;
                    
                    return (
                      <div key={day.date} style={{ textAlign: 'center' }}>
                        <div style={{
                          height: '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            height: `${height}px`,
                            backgroundColor: activity > 0 ? '#0070f3' : '#e9ecef',
                            borderRadius: '4px 4px 0 0',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            paddingBottom: '2px'
                          }}>
                            {activity > 0 && activity}
                          </div>
                        </div>
                        
                        <div style={{ 
                          fontSize: '11px',
                          color: '#666',
                          marginBottom: '4px'
                        }}>
                          {formatDateShort(day.date)}
                        </div>
                        
                        <div style={{ 
                          fontSize: '10px',
                          color: '#999'
                        }}>
                          Q{day.posts} A{day.replies}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ 
                  fontSize: '12px',
                  color: '#666',
                  textAlign: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  Q: 질문, A: 답변 (막대 높이는 일별 총 활동량에 비례)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

