'use client';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">개인정보 처리방침</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-sm max-w-none text-text-secondary">
            <p className="text-sm text-text-tertiary mb-4">
              시행일: 2025년 1월 1일
            </p>

            <p className="mb-4">
              한국산업안전보건기술원(주)(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
            </p>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제1조 (개인정보의 처리 목적)</h3>
            <p className="mb-2">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 등</li>
              <li>교육 서비스 제공: 온라인 교육 콘텐츠 제공, 학습 진도 관리, 수료증 발급, 교육 이력 관리 등</li>
              <li>고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 등</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제2조 (개인정보의 처리 및 보유 기간)</h3>
            <p className="mb-2">회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)</li>
              <li>교육 서비스 제공: 교육 수료일로부터 5년 (산업안전보건법에 따른 교육 이력 보관)</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제3조 (처리하는 개인정보의 항목)</h3>
            <p className="mb-2">회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>필수항목: 휴대전화번호, 이름, 비밀번호</li>
              <li>선택항목: 소속 회사명</li>
              <li>자동 수집 항목: 서비스 이용 기록, 접속 로그, 접속 IP 정보, 학습 진도 정보</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제4조 (개인정보의 제3자 제공)</h3>
            <p className="mb-4">
              회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
            </p>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제5조 (개인정보처리의 위탁)</h3>
            <p className="mb-4">
              회사는 원활한 개인정보 업무처리를 위하여 개인정보 처리업무를 위탁할 수 있으며, 위탁하는 경우 위탁받는 자와 위탁업무 내용을 홈페이지에 공개합니다.
            </p>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제6조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h3>
            <p className="mb-2">정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>개인정보 열람요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제요구</li>
              <li>처리정지 요구</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제7조 (개인정보의 파기)</h3>
            <p className="mb-2">회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
              <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제8조 (개인정보의 안전성 확보조치)</h3>
            <p className="mb-2">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
              <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 개인정보의 암호화, 보안프로그램 설치</li>
              <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제9조 (개인정보 보호책임자)</h3>
            <p className="mb-2">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="bg-bg-primary p-4 rounded-lg mb-4">
              <p className="mb-1"><strong>개인정보 보호책임자</strong></p>
              <p className="mb-1">성명: 정의석</p>
              <p className="mb-1">직책: 대표이사</p>
              <p>연락처: 본 서비스 내 문의하기를 통해 연락</p>
            </div>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제10조 (개인정보 열람청구)</h3>
            <p className="mb-4">
              정보주체는 개인정보보호법 제35조에 따른 개인정보의 열람 청구를 회사에 할 수 있습니다.
            </p>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제11조 (권익침해 구제방법)</h3>
            <p className="mb-2">정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해구제, 상담 등을 문의하실 수 있습니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
              <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
            </ul>

            <h3 className="text-base font-bold text-text-primary mt-6 mb-3">제12조 (개인정보 처리방침 변경)</h3>
            <p className="mb-4">
              이 개인정보 처리방침은 2025년 1월 1일부터 적용됩니다. 이전의 개인정보 처리방침은 본 방침으로 대체됩니다.
            </p>

            <div className="mt-8 p-4 bg-bg-primary rounded-lg border border-border">
              <p className="font-bold text-text-primary mb-2">한국산업안전보건기술원(주)</p>
              <p className="text-sm">대표자: 정의석</p>
              <p className="text-sm">주소: 경기 수원시 권선구 곡반정동 543-4 2층</p>
              <p className="text-sm">사업자등록번호: 790-88-00834</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full h-12 bg-primary text-white rounded-lg text-base font-semibold transition-all hover:bg-primary-600"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
