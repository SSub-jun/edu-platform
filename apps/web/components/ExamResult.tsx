'use client';

import { useRouter } from 'next/navigation';

interface ExamResultProps {
  examScore: number;
  progressPercent: number;
  finalScore: number;
  passed: boolean;
  subjectName: string;
  cycle: number;
  tryIndex: number;
  onRetake?: () => void;
  onBackToDashboard?: () => void;
}

export default function ExamResult({
  examScore,
  progressPercent,
  finalScore,
  passed,
  subjectName,
  cycle,
  tryIndex,
  onRetake,
  onBackToDashboard,
}: ExamResultProps) {
  const router = useRouter();

  const isCloseToPass = finalScore >= 65 && finalScore < 70;
  const isCloseToFail = finalScore >= 69.9 && finalScore < 70;

  const getScoreColor = (score: number, isPassScore: boolean = false) => {
    if (isPassScore) {
      return score >= 70 ? '#4caf50' : '#ff6b6b';
    }
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ffa726';
    return '#ff6b6b';
  };

  const getPassStatusText = () => {
    if (passed) return '합격';
    if (isCloseToFail) return '아쉽게 불합격';
    return '불합격';
  };

  const getPassStatusColor = () => {
    if (passed) return '#4caf50';
    if (isCloseToFail) return '#ffa726';
    return '#ff6b6b';
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
    }}>
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '32px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            시험 결과
          </h1>
          <p style={{
            margin: '0',
            fontSize: '16px',
            color: '#666',
          }}>
            {subjectName} - {cycle}차 시험 ({tryIndex}번째 시도)
          </p>
        </div>

        {/* 합격/불합격 결과 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: getPassStatusColor(),
          borderRadius: '8px',
          color: 'white',
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}>
            {passed ? '🎉' : '😔'}
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}>
            {getPassStatusText()}
          </div>
          <div style={{
            fontSize: '16px',
            opacity: 0.9,
          }}>
            {passed ? '축하합니다! 시험에 합격하셨습니다.' : '다시 한번 도전해보세요.'}
          </div>
        </div>

        {/* 점수 상세 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {/* 시험 점수 */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '8px',
            }}>
              시험 점수
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getScoreColor(examScore),
              marginBottom: '4px',
            }}>
              {examScore.toFixed(1)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
            }}>
              (80% 반영)
            </div>
          </div>

          {/* 진도 점수 */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '8px',
            }}>
              진도 점수
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getScoreColor(progressPercent),
              marginBottom: '4px',
            }}>
              {progressPercent.toFixed(1)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
            }}>
              (20% 반영)
            </div>
          </div>

          {/* 최종 점수 */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            border: '2px solid getScoreColor(finalScore, true)',
            borderRadius: '8px',
            backgroundColor: '#fff',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '8px',
            }}>
              최종 점수
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getScoreColor(finalScore, true),
              marginBottom: '4px',
            }}>
              {finalScore.toFixed(1)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
            }}>
              합격 기준: 70.0
            </div>
          </div>
        </div>

        {/* 경계값 안내 */}
        {isCloseToPass && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#856404',
          }}>
            💡 <strong>합격까지 {Math.ceil(70 - finalScore)}점이 부족합니다.</strong><br />
            진도율을 더 올리거나 시험 점수를 개선하면 합격할 수 있습니다.
          </div>
        )}

        {isCloseToFail && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#721c24',
          }}>
            ⚠️ <strong>아쉽게도 {finalScore.toFixed(1)}점으로 불합격입니다.</strong><br />
            합격 기준 70.0점에 {Math.abs(70 - finalScore).toFixed(1)}점 차이로 아쉽게 떨어졌습니다.
          </div>
        )}

        {/* 점수 계산 설명 */}
        <div style={{
          padding: '16px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '8px',
          marginBottom: '32px',
          fontSize: '14px',
          color: '#1565c0',
        }}>
          <strong>점수 계산 방법:</strong><br />
          최종 점수 = (시험 점수 × 0.8) + (진도율 × 0.2)<br />
          합격 기준: 70.0점 이상
        </div>

        {/* 액션 버튼 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}>
          <button
            onClick={onBackToDashboard}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            대시보드로 돌아가기
          </button>

          {!passed && onRetake && (
            <button
              onClick={onRetake}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              재응시하기
            </button>
          )}
        </div>

        {/* 추가 안내 */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6c757d',
        }}>
          <strong>재응시 안내:</strong><br />
          • 1 cycle당 최대 3회 응시 가능<br />
          • 진도율 90% 이상이어야 다음 cycle 재응시 가능<br />
          • 합격 시 해당 cycle 종료
        </div>
      </div>
    </div>
  );
}
