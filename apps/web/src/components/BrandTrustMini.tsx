import React from 'react';

export default function BrandTrustMini() {
  const trustPoints = [
    {
      id: 1,
      label: '법정 기준 반영',
      description: '현장 규정·요구사항에 맞춘 커리큘럼',
    },
    {
      id: 2,
      label: '정확한 이수 관리',
      description: '진도·시험 결과 자동 기록·열람',
    },
    {
      id: 3,
      label: '기업 환경 최적화',
      description: '연령대 높은 직원도 쉽게 사용하는 UI',
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
      <h3 className="text-xl font-semibold text-text-primary mb-3">
        산업 안전 교육, 신뢰 가능한 기준으로 운영합니다
      </h3>
      <ul className="space-y-2">
        {trustPoints.map((point) => (
          <li key={point.id} className="text-base text-text-secondary">
            <span className="font-medium text-text-primary">• {point.label}</span> — {point.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

