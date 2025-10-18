'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollDate: string;
  totalProgress: number;
  subjectProgress: Record<string, {
    progress: number;
    examScore?: number;
    lastActivity: string;
  }>;
  status: 'active' | 'inactive' | 'completed';
}

export default function StudentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'score'>('name');

  useEffect(() => {
    if (isAuthenticated) {
      loadStudents();
    }
  }, [isAuthenticated]);

  // 필터 변경 시 재로드
  useEffect(() => {
    if (isAuthenticated) {
      loadStudents();
    }
  }, [selectedSubject]);

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(selectedSubject !== 'all' && { subjectId: selectedSubject })
      });

      const response = await fetch(`http://localhost:4000/instructor/students?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // API 데이터를 Student 타입에 맞게 변환
          const apiStudents: Student[] = result.data.students.map((student: any) => {
            // subjectProgress를 객체 형태로 변환
            const subjectProgressMap: Record<string, any> = {};
            student.subjectProgress.forEach((sp: any) => {
              subjectProgressMap[sp.subject.id] = {
                progress: sp.progressPercent,
                lastActivity: sp.updatedAt.split('T')[0]
              };
            });

            // 최근 시험 점수 매핑
            student.recentExams.forEach((exam: any) => {
              if (exam.score && subjectProgressMap[exam.subjectId]) {
                subjectProgressMap[exam.subjectId].examScore = exam.score;
              }
            });

            // 전체 진도율 계산 (평균)
            const progressValues = Object.values(subjectProgressMap).map((sp: any) => sp.progress || 0);
            const totalProgress = progressValues.length > 0 
              ? progressValues.reduce((sum: number, progress: number) => sum + progress, 0) / progressValues.length 
              : 0;

            // 상태 판단 (최근 7일 내 로그인 여부)
            const lastLogin = student.lastLoginAt ? new Date(student.lastLoginAt) : null;
            const isRecentlyActive = lastLogin && (Date.now() - lastLogin.getTime()) < (7 * 24 * 60 * 60 * 1000);

            return {
              id: student.id,
              name: student.username,
              email: student.email || '이메일 없음',
              enrollDate: student.createdAt.split('T')[0],
              totalProgress: Math.round(totalProgress),
              subjectProgress: subjectProgressMap,
              status: isRecentlyActive ? 'active' : 'inactive'
            };
          });
          setStudents(apiStudents);
        }
      } else {
        console.error('Failed to load students:', response.statusText);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };


  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#28a745';
      case 'inactive': return '#6c757d'; 
      case 'completed': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return '수강중';
      case 'inactive': return '비활성';
      case 'completed': return '완료';
      default: return '알수없음';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#28a745';
    if (progress >= 60) return '#fd7e14'; 
    if (progress >= 40) return '#ffc107';
    return '#dc3545';
  };

  if (!isAuthenticated) {
    return <div>인증 중...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => router.push('/instructor')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← 강사 대시보드
            </button>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: '#333',
              margin: 0
            }}>
              👥 학생 관리
            </h1>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>전체 수강생</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>{students.length}명</div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>활성 학습자</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {students.filter(s => s.status === 'active').length}명
            </div>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>평균 진도율</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
              {Math.round(students.reduce((acc, s) => acc + s.totalProgress, 0) / students.length)}%
            </div>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>완료자</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
              {students.filter(s => s.status === 'completed').length}명
            </div>
          </div>
        </div>

        {/* 필터 및 정렬 */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '25px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#495057' }}>과목 필터:</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ 
                padding: '6px 10px', 
                border: '1px solid #ced4da', 
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="all">전체 과목</option>
              <option value="industrial-management">산업관리론</option>
              <option value="quality-management">품질관리</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#495057' }}>정렬:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ 
                padding: '6px 10px', 
                border: '1px solid #ced4da', 
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="name">이름순</option>
              <option value="progress">진도율순</option>
              <option value="score">성적순</option>
            </select>
          </div>
        </div>

        {/* 학생 목록 */}
        <div style={{ 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
        {/* 테이블 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
          padding: '15px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#495057'
        }}>
          <div>학생 정보</div>
          <div>등록일</div>
          <div>상태</div>
          <div>전체 진도</div>
          <div>액션</div>
        </div>

          {/* 학생 행들 */}
          {students.map((student) => (
            <div key={student.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
              padding: '20px',
              borderBottom: '1px solid #e9ecef',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* 학생 정보 */}
              <div>
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                  {student.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {student.email}
                </div>
              </div>

              {/* 등록일 */}
              <div style={{ fontSize: '14px', color: '#495057' }}>
                {student.enrollDate}
              </div>

              {/* 상태 */}
              <div>
                <span style={{ 
                  backgroundColor: getStatusColor(student.status), 
                  color: 'white',
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px'
                }}>
                  {getStatusText(student.status)}
                </span>
              </div>

              {/* 전체 진도 */}
              <div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e9ecef', 
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '5px'
                }}>
                  <div style={{ 
                    width: `${student.totalProgress}%`, 
                    height: '100%', 
                    backgroundColor: getProgressColor(student.totalProgress)
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#495057', textAlign: 'center' }}>
                  {student.totalProgress}%
                </div>
              </div>

              {/* 액션 버튼 */}
              <div>
                <button
                  onClick={() => router.push(`/instructor/students/${student.id}`)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  📋 상세 보기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 액션 버튼들 */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginTop: '20px',
          justifyContent: 'center'
        }}>
          <button style={{
            padding: '12px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            📋 CSV 내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
