'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '../../../../lib/auth';

interface SubjectDetail {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function SubjectManagePage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subjectId as string;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    order: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubject = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authClient.getApi().get(`/instructor/subjects/${subjectId}`);
      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        setSubject(data);
        setForm({
          name: data.name,
          description: data.description || '',
          order: data.order || 0,
          isActive: data.isActive,
        });
      } else {
        throw new Error('과목 정보를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('[ADMIN][SUBJECT_DETAIL] load failed', err);
      setError('과목 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    if (!subject) return;
    setSaving(true);
    try {
      await authClient.getApi().put(`/instructor/subjects/${subject.id}`, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        order: form.order,
        isActive: form.isActive,
      });
      alert('기본 정보가 저장되었습니다.');
      loadSubject();
    } catch (err) {
      console.error('[ADMIN][SUBJECT_DETAIL] save failed', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (subjectId) {
      loadSubject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  if (!subjectId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        잘못된 접근입니다. 과목 ID가 필요합니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        로딩 중...
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#dc3545' }}>
        {error ?? '과목을 찾을 수 없습니다.'}
      </div>
    );
  }

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
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div>
            <button
              onClick={() => router.push('/admin/subjects')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '14px'
              }}
            >
              ← 과목 목록
            </button>
            <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 700 }}>
              {subject.name}
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              과목 기본 정보, 레슨, 시험 문제를 순차적으로 구성하세요.
            </p>
          </div>
        </div>

        {/* 기본 정보 편집 */}
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#fafafa'
        }}>
          <h2 style={{ marginTop: 0 }}>기본 정보</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>과목명 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  marginTop: '6px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>정렬 순서</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  marginTop: '6px'
                }}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  marginTop: '6px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>상태</label>
              <select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  marginTop: '6px'
                }}
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button
              disabled={saving}
              onClick={handleSaveBasic}
              style={{
                padding: '10px 18px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? '저장 중...' : '기본 정보 저장'}
            </button>
          </div>
        </div>

        {/* 탭 영역 */}
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ marginTop: 0 }}>레슨 구성 (준비 중)</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            레슨 목록, 영상 업로드, 파트 편집 기능이 곧 제공됩니다.
          </p>
        </div>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ marginTop: 0 }}>시험 문제 (준비 중)</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            과목별 시험 문제 관리, 보기/정답/해설 편집 UI가 이 섹션에 추가됩니다.
          </p>
        </div>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ marginTop: 0 }}>추가 리소스 (준비 중)</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            레퍼런스 문서, 참고 링크 등을 업로드할 수 있는 공간입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

