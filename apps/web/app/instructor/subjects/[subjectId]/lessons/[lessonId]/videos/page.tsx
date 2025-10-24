'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '../../../../../../../lib/auth';

interface VideoPart {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationMs: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  subject: {
    id: string;
    name: string;
  };
}

export default function LessonVideosManagePage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;
  const subjectId = params.subjectId as string;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [video, setVideo] = useState<VideoPart | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  const loadData = async () => {
    try {
      // 레슨 정보 로드 (instructor API 사용)
      const subjectResponse = await authClient.getApi().get(`/instructor/subjects/${subjectId}`);
      if (subjectResponse.data.success) {
        const lessonData = subjectResponse.data.data.lessons.find((l: any) => l.id === lessonId);
        if (lessonData) {
          setLesson({
            id: lessonData.id,
            title: lessonData.title,
            description: lessonData.description,
            subject: {
              id: subjectResponse.data.data.id,
              name: subjectResponse.data.data.name
            }
          });
        }
      }

      // 영상 로드 (첫 번째 영상만)
      const videosResponse = await authClient.getApi().get(`/media/lessons/${lessonId}/videos`);
      if (videosResponse.data.success && videosResponse.data.data && videosResponse.data.data.length > 0) {
        setVideo(videosResponse.data.data[0]); // 첫 번째 영상만 사용
      } else {
        setVideo(null);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewVideo({ ...newVideo, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!newVideo.file || !newVideo.title.trim()) {
      alert('파일과 제목을 입력해주세요.');
      return;
    }

    // 기존 영상이 있으면 경고
    if (video) {
      if (!confirm('기존 영상이 삭제되고 새 영상으로 교체됩니다. 계속하시겠습니까?')) {
        return;
      }
      // 기존 영상 삭제
      try {
        await authClient.getApi().delete(`/media/videos/${video.id}`);
      } catch (err) {
        console.error('기존 영상 삭제 실패:', err);
        alert('기존 영상 삭제에 실패했습니다.');
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', newVideo.file);
      formData.append('lessonId', lessonId);
      formData.append('title', newVideo.title.trim());
      if (newVideo.description.trim()) {
        formData.append('description', newVideo.description.trim());
      }
      formData.append('order', '0'); // 항상 0으로 고정

      // XMLHttpRequest를 사용하여 업로드 진행률 추적
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        xhr.open('POST', `${apiUrl}/media/videos/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      alert('영상이 성공적으로 업로드되었습니다!');
      setNewVideo({ title: '', description: '', file: null });
      setShowUploadForm(false);
      loadData();
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('영상 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (!confirm(`'${title}' 영상을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await authClient.getApi().delete(`/media/videos/${videoId}`);
      alert('영상이 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('영상 삭제 실패:', error);
      alert('영상 삭제에 실패했습니다.');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();
  }, [lessonId]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#666', fontSize: '16px' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#dc3545', fontSize: '16px' }}>
          레슨을 찾을 수 없습니다.
        </div>
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <button
              onClick={() => router.push(`/instructor/subjects/${subjectId}`)}
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
              ← 과목 관리
            </button>
            
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: 0
            }}>
              📹 {lesson.title} - 영상 관리
            </h1>
          </div>

          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            fontSize: '14px',
            color: '#666'
          }}>
            <div><strong>과목:</strong> {lesson.subject.name}</div>
            <div><strong>레슨:</strong> {lesson.title}</div>
            {lesson.description && <div><strong>설명:</strong> {lesson.description}</div>}
            <div><strong>영상 상태:</strong> {video ? '✅ 업로드됨' : '❌ 미업로드'}</div>
          </div>
        </div>

        {/* 영상 업로드 버튼 */}
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 }}>
            레슨 영상
          </h2>
          
          <button
            onClick={() => setShowUploadForm(true)}
            disabled={uploading}
            style={{
              padding: '12px 20px',
              backgroundColor: uploading ? '#6c757d' : video ? '#28a745' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {uploading ? '⏳ 업로드 중...' : video ? '🔄 영상 교체' : '➕ 영상 업로드'}
          </button>
        </div>

        {/* 업로드 폼 */}
        {showUploadForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {video ? '영상 교체' : '새 영상 업로드'}
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                영상 파일 * (최대 500MB)
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleFileChange}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              />
              {newVideo.file && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  선택된 파일: {newVideo.file.name} ({formatFileSize(newVideo.file.size)})
                </div>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                영상 제목 *
              </label>
              <input
                type="text"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                placeholder="영상 제목을 입력하세요"
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' }}>
                설명
              </label>
              <textarea
                value={newVideo.description}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                placeholder="영상 설명을 입력하세요 (선택사항)"
                disabled={uploading}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 업로드 진행률 */}
            {uploading && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  width: '100%',
                  height: '30px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#0070f3',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {uploadProgress}%
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUpload}
                disabled={uploading || !newVideo.file || !newVideo.title.trim()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: uploading || !newVideo.file || !newVideo.title.trim() ? '#6c757d' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploading || !newVideo.file || !newVideo.title.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {uploading ? '업로드 중...' : '업로드 시작'}
              </button>
              
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setNewVideo({ title: '', description: '', file: null });
                }}
                disabled={uploading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 영상 표시 */}
        {!video ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            color: '#666',
            fontSize: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            업로드된 영상이 없습니다. 영상을 업로드해주세요!
          </div>
        ) : (
          <div
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: video.isActive ? '#fafafa' : '#f8f8f8',
              opacity: video.isActive ? 1 : 0.6
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {!video.isActive && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#dc3545',
                      backgroundColor: '#f8d7da',
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>
                      비활성
                    </span>
                  </div>
                )}

                <h3 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {video.title}
                </h3>

                {video.description && (
                  <p style={{ 
                    margin: '0 0 10px 0',
                    color: '#666',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {video.description}
                  </p>
                )}

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#666',
                  marginTop: '10px'
                }}>
                  <div><strong>파일 크기:</strong> {formatFileSize(video.fileSize)}</div>
                  <div><strong>형식:</strong> {video.mimeType?.split('/')[1]?.toUpperCase() || 'N/A'}</div>
                  {video.videoUrl && (
                    <div>
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${video.videoUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0070f3', textDecoration: 'underline' }}
                      >
                        🎬 미리보기
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteVideo(video.id, video.title)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginLeft: '15px'
                }}
              >
                🗑️ 삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
