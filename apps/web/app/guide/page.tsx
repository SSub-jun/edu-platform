'use client';

export const dynamic = 'force-dynamic';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-bg-primary px-4 py-8 md:py-10">
      <div className="max-w-4xl mx-auto bg-surface border border-border rounded-xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
          교육소개 및 수강 안내
        </h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-3">교육기관 소개</h2>
          <p className="text-base text-text-secondary leading-relaxed">
            한국산업보건안전기술원 온라인 교육센터는 산업재해 예방과 안전문화 정착을 목표로,
            사업장 현장에서 바로 활용 가능한 실무 중심의 안전보건 교육을 제공합니다.
            산업안전보건법령에서 요구하는 법정·위탁 교육 과정을 체계적으로 운영하고 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-3">교육기간</h2>
          <ul className="list-disc pl-5 space-y-1 text-base text-text-secondary">
            <li>교육기간은 회사(고객사) 단위로 설정되며, 시작일 기준 6개월 동안 수강이 가능합니다.</li>
            <li>수강기간 내에는 자유롭게 로그인하여 학습 및 평가를 진행하실 수 있습니다.</li>
            <li>수강기간이 종료되면 신규 수강 및 평가 응시는 제한될 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-3">교육방법</h2>
          <ul className="list-disc pl-5 space-y-1 text-base text-text-secondary">
            <li>100% 온라인 동영상 기반 이러닝 교육으로 제공됩니다.</li>
            <li>각 과목은 여러 개의 강의(레슨)으로 구성되며, 레슨별 학습 진도율이 자동으로 기록됩니다.</li>
            <li>레슨 진도율은 동영상 시청 시간 기준으로 계산되며, 90% 이상 수강 시 ‘수강 완료’로 반영됩니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-3">교육진행절차</h2>
          <ol className="list-decimal pl-5 space-y-2 text-base text-text-secondary">
            <li><span className="font-semibold text-text-primary">회원가입 및 로그인</span><br />회사에서 안내받은 방식에 따라 회원가입 후 로그인합니다.</li>
            <li><span className="font-semibold text-text-primary">강의실 접속</span><br />상단 내비게이션의 「강의실」 메뉴에서 배정된 교육과정을 확인합니다.</li>
            <li><span className="font-semibold text-text-primary">동영상 학습</span><br />각 레슨의 동영상을 시청하며, 시청 시간에 따라 진도율이 자동으로 저장됩니다.</li>
            <li><span className="font-semibold text-text-primary">학습평가(시험) 응시</span><br />해당 레슨 진도율이 90% 이상일 때 레슨 시험에 응시할 수 있습니다.</li>
            <li><span className="font-semibold text-text-primary">수료</span><br />진도율과 학습평가 점수를 반영한 최종 점수가 수료 기준을 충족하면 교육을 수료하게 됩니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-3">수료 기준</h2>
          <ul className="list-disc pl-5 space-y-2 text-base text-text-secondary">
            <li>각 강의(레슨) 단위로 수료 여부를 판단합니다.</li>
            <li>레슨 진도율이 90% 이상이어야 학습평가(시험)에 응시할 수 있습니다.</li>
            <li>레슨 최종 점수는 진도 20점 + 학습평가 80점으로 계산되며, 총점 70점 이상일 경우 해당 레슨을 수료한 것으로 인정됩니다.</li>
            <li>과목은 해당 과목에 포함된 모든 레슨이 수료된 경우에만 수료로 처리됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">교육생 유의사항</h2>
          <ul className="list-disc pl-5 space-y-2 text-base text-text-secondary">
            <li>모든 교육은 개인 계정 기준으로 운영되며, 계정 공유 및 대리 수강은 엄격히 금지됩니다.</li>
            <li>수강기간 내에 진도 및 평가를 모두 완료하지 못한 경우, 미수료 처리될 수 있습니다.</li>
            <li>학습 중 오류 또는 문의 사항이 있을 경우, Q&amp;A 메뉴 또는 회사 담당자를 통해 문의해 주세요.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}


