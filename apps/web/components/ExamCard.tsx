'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExamCardProps {
  subjectId: string;
  subjectName: string;
  cycle: number;
  tryIndex: number;
  maxAttempts: number;
  progressPercent: number;
  isLocked: boolean;
  lockReason?: string;
  onStartExam: () => void;
}

export default function ExamCard({
  subjectId,
  subjectName,
  cycle,
  tryIndex,
  maxAttempts,
  progressPercent,
  isLocked,
  lockReason,
  onStartExam,
}: ExamCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remainingAttempts = maxAttempts - tryIndex + 1;
  const canRetake = progressPercent >= 90;
  const isMaxAttemptsReached = tryIndex > maxAttempts;

  const handleStartExam = async () => {
    if (isLocked) {
      alert(lockReason || '시험을 시작할 수 없습니다.');
      return;
    }

    setLoading(true);
    try {
      onStartExam();
      router.push(`/exam/${subjectId}`);
    } catch (error) {
      console.error('시험 시작 오류:', error);
      alert('시험 시작 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (isLocked) return '#ff6b6b';
    if (isMaxAttemptsReached) return '#ffa726';
    if (remainingAttempts <= 1) return '#ffcc02';
    return '#4caf50';
  };

  const getStatusText = () => {
    if (isLocked) return '잠김';
    if (isMaxAttemptsReached) return '제한됨';
    if (remainingAttempts <= 1) return '마지막 기회';
    return '응시 가능';
  };

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 'bold',
          }}>
            {subjectName}
          </h3>
          <p style={{
            margin: '0',
            color: '#666',
            fontSize: '14px',
          }}>
            {cycle}차 시험
          </p>
        </div>
        
        <div style={{
          padding: '4px 12px',
          borderRadius: '16px',
          backgroundColor: getStatusColor(),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {getStatusText()}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px',
          }}>
            남은 응시 횟수
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: remainingAttempts > 0 ? '#4caf50' : '#ff6b6b',
          }}>
            {Math.max(0, remainingAttempts)}회
          </div>
        </div>

        <div>
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px',
          }}>
            진도율
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: progressPercent >= 90 ? '#4caf50' : '#ffa726',
          }}>
            {progressPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {isLocked && lockReason && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#856404',
        }}>
          🔒 {lockReason}
        </div>
      )}

      {isMaxAttemptsReached && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#721c24',
        }}>
          ⚠️ 이번 cycle의 모든 응시 기회를 소진했습니다.
          {canRetake && (
            <div style={{ marginTop: '8px' }}>
              진도율이 90% 이상이므로 다음 cycle에 재응시할 수 있습니다.
            </div>
          )}
        </div>
      )}

      {!canRetake && !isMaxAttemptsReached && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#0c5460',
        }}>
          💡 진도율을 90% 이상으로 올려야 다음 cycle에 재응시할 수 있습니다.
        </div>
      )}

      <button
        onClick={handleStartExam}
        disabled={loading || isLocked || isMaxAttemptsReached}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isLocked || isMaxAttemptsReached ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: isLocked || isMaxAttemptsReached ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '시험 시작 중...' : 
         isLocked ? '시험 잠김' :
         isMaxAttemptsReached ? '응시 제한' :
         '시험 시작'}
      </button>
    </div>
  );
}
