import React from 'react';

export default function BrandTrustSection() {
  const trustCards = [
    {
      id: 1,
      title: '산업현장 기준에 맞춘 전문 교육',
      description: '현장 중심의 산업안전 규정과 법적 요구사항을 기반으로 커리큘럼을 구성하여 기업이 필요한 교육 품질을 안정적으로 제공합니다.',
    },
    {
      id: 2,
      title: '정확하고 투명한 이수 관리 시스템',
      description: '학습 진도와 이수 정보는 자동으로 기록되며, 관리자 페이지에서 실시간으로 확인할 수 있어 기업 고객이 교육 진행 상황을 쉽게 관리할 수 있습니다.',
    },
    {
      id: 3,
      title: '기업 환경에 최적화된 운영 솔루션',
      description: '다양한 산업군과 근로자 특성을 고려한 사용자 친화적 구조로, 연령대가 높은 직원들도 쉽게 참여할 수 있는 환경을 제공합니다.',
    },
  ];

  return (
    <section aria-labelledby="brand-trust-heading" className="max-w-7xl mx-auto px-6 py-12">
      <h2 id="brand-trust-heading" className="text-2xl font-semibold text-text-primary mb-4 text-center">
        신뢰할 수 있는 교육 플랫폼
      </h2>
      <p className="text-base text-text-secondary text-center mb-8">
        기업 고객이 안심하고 사용할 수 있는 전문적인 교육 환경을 제공합니다
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trustCards.map((card) => (
          <div
            key={card.id}
            className="bg-surface border border-border rounded-xl p-4 md:p-6 hover:border-border-light transition-colors"
          >
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {card.title}
            </h3>
            <p className="text-base text-text-secondary leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

