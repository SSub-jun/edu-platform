-- =====================================================
-- 산업안전 교육 샘플 데이터
-- =====================================================

-- 1. 관리자 계정 생성 (비밀번호: Admin123!)
INSERT INTO "users" ("id", "username", "passwordHash", "role", "name", "phone", "phoneVerifiedAt", "createdAt", "updatedAt")
VALUES 
('admin001', 'admin', '$2b$10$YourHashHere', 'admin', '관리자', '01012345678', NOW(), NOW(), NOW());

-- 2. 회사 생성 (6개월 수강 기간)
INSERT INTO "companies" ("id", "name", "startDate", "endDate", "isActive", "inviteCode", "createdAt", "updatedAt")
VALUES 
('company001', 'KIST 안전교육센터', NOW(), NOW() + INTERVAL '6 months', true, 'KIST2024', NOW(), NOW());

-- 3. 과목(Subject) 생성 - 산업안전 기초 3과목
INSERT INTO "subjects" ("id", "name", "description", "order", "isActive", "createdAt", "updatedAt")
VALUES 
('subject001', '산업안전 기초', '산업 현장에서 반드시 알아야 할 기본 안전 수칙을 학습합니다.', 1, true, NOW(), NOW()),
('subject002', '개인보호구 착용법', '안전모, 안전화, 보안경 등 개인보호구의 올바른 착용 방법을 배웁니다.', 2, true, NOW(), NOW()),
('subject003', '화재 예방과 대응', '화재 발생 시 대피 요령과 소화기 사용법을 익힙니다.', 3, true, NOW(), NOW());

-- 4. 회사에 과목 배정
INSERT INTO "company_subjects" ("id", "companyId", "subjectId", "createdAt")
VALUES 
('cs001', 'company001', 'subject001', NOW()),
('cs002', 'company001', 'subject002', NOW()),
('cs003', 'company001', 'subject003', NOW());

-- 5. 강의(Lesson) 생성

-- 과목1: 산업안전 기초 (3개 강의)
INSERT INTO "lessons" ("id", "subjectId", "title", "description", "order", "isActive", "createdAt", "updatedAt")
VALUES 
('lesson001', 'subject001', '안전의 중요성', '산업 현장에서 안전이 왜 중요한지 이해합니다.', 1, true, NOW(), NOW()),
('lesson002', 'subject001', '작업 전 안전 점검', '작업을 시작하기 전 반드시 확인해야 할 사항들을 배웁니다.', 2, true, NOW(), NOW()),
('lesson003', 'subject001', '위험 요소 파악하기', '작업장 내 위험 요소를 찾아내고 대처하는 방법을 학습합니다.', 3, true, NOW(), NOW());

-- 과목2: 개인보호구 착용법 (3개 강의)
INSERT INTO "lessons" ("id", "subjectId", "title", "description", "order", "isActive", "createdAt", "updatedAt")
VALUES 
('lesson004', 'subject002', '안전모 착용법', '안전모의 종류와 올바른 착용 방법을 배웁니다.', 1, true, NOW(), NOW()),
('lesson005', 'subject002', '안전화와 안전장갑', '발과 손을 보호하는 보호구 사용법을 익힙니다.', 2, true, NOW(), NOW()),
('lesson006', 'subject002', '보안경과 귀마개', '눈과 귀를 보호하는 장비의 착용법을 학습합니다.', 3, true, NOW(), NOW());

-- 과목3: 화재 예방과 대응 (3개 강의)
INSERT INTO "lessons" ("id", "subjectId", "title", "description", "order", "isActive", "createdAt", "updatedAt")
VALUES 
('lesson007', 'subject003', '화재의 3요소', '불이 나기 위한 조건과 화재 예방법을 배웁니다.', 1, true, NOW(), NOW()),
('lesson008', 'subject003', '소화기 사용법', '소화기의 종류와 사용 방법을 익힙니다.', 2, true, NOW(), NOW()),
('lesson009', 'subject003', '화재 시 대피 요령', '화재 발생 시 안전하게 대피하는 방법을 학습합니다.', 3, true, NOW(), NOW());

-- 6. 시험 문제 생성 (각 과목당 10문제씩)

-- === 과목1: 산업안전 기초 (10문제) ===
INSERT INTO "questions" ("id", "subjectId", "stem", "explanation", "answerIndex", "isActive", "createdAt", "updatedAt")
VALUES 
('q001', 'subject001', '산업 현장에서 안전이 가장 중요한 이유는 무엇인가요?', '생명과 건강을 지키는 것이 최우선입니다.', 0, true, NOW(), NOW()),
('q002', 'subject001', '작업 시작 전 반드시 해야 할 것은?', '안전 점검을 통해 위험을 미리 파악해야 합니다.', 1, true, NOW(), NOW()),
('q003', 'subject001', '작업장에서 위험을 발견했을 때 가장 먼저 해야 할 행동은?', '즉시 작업을 중단하고 관리자에게 보고해야 합니다.', 2, true, NOW(), NOW()),
('q004', 'subject001', '안전 수칙을 지키지 않으면 어떤 일이 발생할 수 있나요?', '사고로 인한 부상이나 사망이 발생할 수 있습니다.', 0, true, NOW(), NOW()),
('q005', 'subject001', '작업 중 피곤함을 느낄 때 올바른 행동은?', '충분한 휴식을 취한 후 작업을 계속해야 합니다.', 1, true, NOW(), NOW()),
('q006', 'subject001', '안전 표지판의 역할은 무엇인가요?', '위험을 미리 알려주어 사고를 예방합니다.', 2, true, NOW(), NOW()),
('q007', 'subject001', '작업장 정리정돈이 중요한 이유는?', '넘어지거나 부딪히는 사고를 예방할 수 있습니다.', 0, true, NOW(), NOW()),
('q008', 'subject001', '안전 교육을 받아야 하는 이유는?', '올바른 안전 지식을 습득하여 사고를 예방하기 위해서입니다.', 1, true, NOW(), NOW()),
('q009', 'subject001', '작업 중 이상 상황 발견 시 행동 요령은?', '즉시 작업을 멈추고 상황을 보고해야 합니다.', 2, true, NOW(), NOW()),
('q010', 'subject001', '안전한 작업 환경을 만들기 위해 필요한 것은?', '모든 작업자의 안전 의식과 협력이 필요합니다.', 0, true, NOW(), NOW());

-- === 과목2: 개인보호구 착용법 (10문제) ===
INSERT INTO "questions" ("id", "subjectId", "stem", "explanation", "answerIndex", "isActive", "createdAt", "updatedAt")
VALUES 
('q011', 'subject002', '안전모를 착용해야 하는 가장 큰 이유는?', '머리를 보호하여 심각한 부상을 예방합니다.', 0, true, NOW(), NOW()),
('q012', 'subject002', '안전모 착용 시 턱끈은 어떻게 해야 하나요?', '턱끈을 단단히 조여야 안전모가 벗겨지지 않습니다.', 1, true, NOW(), NOW()),
('q013', 'subject002', '안전화를 신어야 하는 이유는?', '발을 보호하고 미끄러짐을 방지합니다.', 2, true, NOW(), NOW()),
('q014', 'subject002', '안전장갑을 착용하는 목적은?', '손을 보호하고 화학물질로부터 피부를 지킵니다.', 0, true, NOW(), NOW()),
('q015', 'subject002', '보안경을 착용해야 하는 작업은?', '눈에 이물질이 들어갈 위험이 있는 모든 작업입니다.', 1, true, NOW(), NOW()),
('q016', 'subject002', '귀마개나 귀덮개를 착용하는 이유는?', '큰 소음으로부터 청력을 보호하기 위해서입니다.', 2, true, NOW(), NOW()),
('q017', 'subject002', '개인보호구가 손상되었을 때 해야 할 일은?', '즉시 새것으로 교체해야 합니다.', 0, true, NOW(), NOW()),
('q018', 'subject002', '작업에 맞지 않는 보호구를 사용하면?', '제대로 보호받지 못해 사고 위험이 높아집니다.', 1, true, NOW(), NOW()),
('q019', 'subject002', '개인보호구 착용 전 확인해야 할 사항은?', '손상이나 결함이 없는지 점검해야 합니다.', 2, true, NOW(), NOW()),
('q020', 'subject002', '개인보호구를 착용하지 않고 작업하면?', '법적 처벌을 받을 수 있으며 사고 위험이 높습니다.', 0, true, NOW(), NOW());

-- === 과목3: 화재 예방과 대응 (10문제) ===
INSERT INTO "questions" ("id", "subjectId", "stem", "explanation", "answerIndex", "isActive", "createdAt", "updatedAt")
VALUES 
('q021', 'subject003', '화재가 발생하기 위한 3요소는 무엇인가요?', '산소, 열, 가연물이 있어야 불이 납니다.', 0, true, NOW(), NOW()),
('q022', 'subject003', '화재를 예방하기 위한 가장 기본적인 방법은?', '불씨 관리를 철저히 하고 가연물을 정리해야 합니다.', 1, true, NOW(), NOW()),
('q023', 'subject003', '소화기 사용 시 가장 먼저 해야 할 것은?', '안전핀을 뽑아야 합니다.', 2, true, NOW(), NOW()),
('q024', 'subject003', '소화기는 불의 어느 부분을 향해 뿌려야 하나요?', '불길의 아래쪽, 즉 불의 근원을 향해 뿌려야 합니다.', 0, true, NOW(), NOW()),
('q025', 'subject003', '화재 발생 시 가장 먼저 해야 할 행동은?', '큰 소리로 "불이야!"라고 외쳐 주변에 알려야 합니다.', 1, true, NOW(), NOW()),
('q026', 'subject003', '화재 시 연기가 가득할 때 대피 방법은?', '자세를 낮추고 젖은 수건으로 코와 입을 막고 이동합니다.', 2, true, NOW(), NOW()),
('q027', 'subject003', '화재 시 엘리베이터를 사용하면 안 되는 이유는?', '정전으로 갇힐 수 있고 연기가 차올라 위험합니다.', 0, true, NOW(), NOW()),
('q028', 'subject003', '소화기의 사용 거리는 얼마나 되나요?', '불에서 약 3~4미터 떨어진 거리에서 사용합니다.', 1, true, NOW(), NOW()),
('q029', 'subject003', '대피 후 절대 하지 말아야 할 행동은?', '다시 건물 안으로 들어가서는 안 됩니다.', 2, true, NOW(), NOW()),
('q030', 'subject003', '화재 신고 전화번호는?', '119에 신고해야 합니다.', 0, true, NOW(), NOW());

-- 7. 선택지(Choice) 생성

-- Q001 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c001', 'q001', '생명과 건강을 지키기 위해서', true, 0, NOW(), NOW()),
('c002', 'q001', '회사 이익을 높이기 위해서', false, 1, NOW(), NOW()),
('c003', 'q001', '법적 처벌을 피하기 위해서', false, 2, NOW(), NOW()),
('c004', 'q001', '작업 속도를 높이기 위해서', false, 3, NOW(), NOW());

-- Q002 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c005', 'q002', '빨리 작업을 시작한다', false, 0, NOW(), NOW()),
('c006', 'q002', '안전 점검을 실시한다', true, 1, NOW(), NOW()),
('c007', 'q002', '동료와 잡담을 나눈다', false, 2, NOW(), NOW()),
('c008', 'q002', '장비를 임의로 조작한다', false, 3, NOW(), NOW());

-- Q003 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c009', 'q003', '모른 척하고 지나간다', false, 0, NOW(), NOW()),
('c010', 'q003', '나중에 보고한다', false, 1, NOW(), NOW()),
('c011', 'q003', '즉시 작업을 중단하고 보고한다', true, 2, NOW(), NOW()),
('c012', 'q003', '혼자 해결하려고 시도한다', false, 3, NOW(), NOW());

-- Q004 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c013', 'q004', '사고로 인한 부상이나 사망', true, 0, NOW(), NOW()),
('c014', 'q004', '작업 속도가 빨라진다', false, 1, NOW(), NOW()),
('c015', 'q004', '아무 일도 일어나지 않는다', false, 2, NOW(), NOW()),
('c016', 'q004', '칭찬을 받는다', false, 3, NOW(), NOW());

-- Q005 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c017', 'q005', '참고 계속 일한다', false, 0, NOW(), NOW()),
('c018', 'q005', '충분한 휴식을 취한다', true, 1, NOW(), NOW()),
('c019', 'q005', '커피를 마시고 계속한다', false, 2, NOW(), NOW()),
('c020', 'q005', '더 빨리 작업한다', false, 3, NOW(), NOW());

-- Q006 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c021', 'q006', '작업장을 꾸미기 위해', false, 0, NOW(), NOW()),
('c022', 'q006', '법적 의무사항이라서', false, 1, NOW(), NOW()),
('c023', 'q006', '위험을 알려 사고를 예방', true, 2, NOW(), NOW()),
('c024', 'q006', '작업 속도를 높이기 위해', false, 3, NOW(), NOW());

-- Q007 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c025', 'q007', '넘어지는 사고를 예방', true, 0, NOW(), NOW()),
('c026', 'q007', '보기 좋게 하기 위해', false, 1, NOW(), NOW()),
('c027', 'q007', '관리자에게 칭찬받기 위해', false, 2, NOW(), NOW()),
('c028', 'q007', '특별한 이유가 없다', false, 3, NOW(), NOW());

-- Q008 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c029', 'q008', '시간을 보내기 위해', false, 0, NOW(), NOW()),
('c030', 'q008', '안전 지식을 습득하기 위해', true, 1, NOW(), NOW()),
('c031', 'q008', '법적 의무라서', false, 2, NOW(), NOW()),
('c032', 'q008', '동료들과 만나기 위해', false, 3, NOW(), NOW());

-- Q009 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c033', 'q009', '계속 작업한다', false, 0, NOW(), NOW()),
('c034', 'q009', '나중에 보고한다', false, 1, NOW(), NOW()),
('c035', 'q009', '즉시 작업을 멈추고 보고', true, 2, NOW(), NOW()),
('c036', 'q009', '혼자 해결한다', false, 3, NOW(), NOW());

-- Q010 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c037', 'q010', '모든 작업자의 안전 의식', true, 0, NOW(), NOW()),
('c038', 'q010', '비싼 안전 장비', false, 1, NOW(), NOW()),
('c039', 'q010', '엄격한 처벌', false, 2, NOW(), NOW()),
('c040', 'q010', '많은 안전 표지판', false, 3, NOW(), NOW());

-- Q011 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c041', 'q011', '머리를 보호하기 위해', true, 0, NOW(), NOW()),
('c042', 'q011', '멋있어 보이기 위해', false, 1, NOW(), NOW()),
('c043', 'q011', '법적 의무라서', false, 2, NOW(), NOW()),
('c044', 'q011', '햇빛을 가리기 위해', false, 3, NOW(), NOW());

-- Q012 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c045', 'q012', '느슨하게 둔다', false, 0, NOW(), NOW()),
('c046', 'q012', '단단히 조인다', true, 1, NOW(), NOW()),
('c047', 'q012', '매지 않는다', false, 2, NOW(), NOW()),
('c048', 'q012', '한쪽만 맨다', false, 3, NOW(), NOW());

-- Q013 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c049', 'q013', '편하게 작업하기 위해', false, 0, NOW(), NOW()),
('c050', 'q013', '멋있어 보이기 위해', false, 1, NOW(), NOW()),
('c051', 'q013', '발을 보호하고 미끄럼 방지', true, 2, NOW(), NOW()),
('c052', 'q013', '발을 따뜻하게 하기 위해', false, 3, NOW(), NOW());

-- Q014 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c053', 'q014', '손을 보호하기 위해', true, 0, NOW(), NOW()),
('c054', 'q014', '손을 따뜻하게 하기 위해', false, 1, NOW(), NOW()),
('c055', 'q014', '손이 더러워지지 않게', false, 2, NOW(), NOW()),
('c056', 'q014', '멋있어 보이기 위해', false, 3, NOW(), NOW());

-- Q015 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c057', 'q015', '햇빛이 강한 작업', false, 0, NOW(), NOW()),
('c058', 'q015', '눈에 이물질이 들어갈 위험이 있는 작업', true, 1, NOW(), NOW()),
('c059', 'q015', '어두운 곳에서의 작업', false, 2, NOW(), NOW()),
('c060', 'q015', '모든 작업', false, 3, NOW(), NOW());

-- Q016 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c061', 'q016', '주변 소리를 듣지 않기 위해', false, 0, NOW(), NOW()),
('c062', 'q016', '집중력을 높이기 위해', false, 1, NOW(), NOW()),
('c063', 'q016', '청력을 보호하기 위해', true, 2, NOW(), NOW()),
('c064', 'q016', '멋있어 보이기 위해', false, 3, NOW(), NOW());

-- Q017 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c065', 'q017', '즉시 새것으로 교체', true, 0, NOW(), NOW()),
('c066', 'q017', '그대로 사용한다', false, 1, NOW(), NOW()),
('c067', 'q017', '테이프로 수리한다', false, 2, NOW(), NOW()),
('c068', 'q017', '나중에 교체한다', false, 3, NOW(), NOW());

-- Q018 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c069', 'q018', '아무 문제 없다', false, 0, NOW(), NOW()),
('c070', 'q018', '사고 위험이 높아진다', true, 1, NOW(), NOW()),
('c071', 'q018', '작업이 더 편하다', false, 2, NOW(), NOW()),
('c072', 'q018', '비용이 절약된다', false, 3, NOW(), NOW());

-- Q019 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c073', 'q019', '색상이 마음에 드는지', false, 0, NOW(), NOW()),
('c074', 'q019', '크기가 맞는지', false, 1, NOW(), NOW()),
('c075', 'q019', '손상이나 결함이 없는지', true, 2, NOW(), NOW()),
('c076', 'q019', '최신 제품인지', false, 3, NOW(), NOW());

-- Q020 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c077', 'q020', '법적 처벌과 사고 위험 증가', true, 0, NOW(), NOW()),
('c078', 'q020', '작업이 더 편해진다', false, 1, NOW(), NOW()),
('c079', 'q020', '아무 일도 일어나지 않는다', false, 2, NOW(), NOW()),
('c080', 'q020', '칭찬을 받는다', false, 3, NOW(), NOW());

-- Q021 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c081', 'q021', '산소, 열, 가연물', true, 0, NOW(), NOW()),
('c082', 'q021', '물, 불, 바람', false, 1, NOW(), NOW()),
('c083', 'q021', '연기, 불꽃, 열기', false, 2, NOW(), NOW()),
('c084', 'q021', '성냥, 라이터, 가스', false, 3, NOW(), NOW());

-- Q022 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c085', 'q022', '소화기를 많이 비치한다', false, 0, NOW(), NOW()),
('c086', 'q022', '불씨 관리와 가연물 정리', true, 1, NOW(), NOW()),
('c087', 'q022', '화재 경보기를 설치한다', false, 2, NOW(), NOW()),
('c088', 'q022', '비상구를 확인한다', false, 3, NOW(), NOW());

-- Q023 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c089', 'q023', '호스를 잡는다', false, 0, NOW(), NOW()),
('c090', 'q023', '레버를 누른다', false, 1, NOW(), NOW()),
('c091', 'q023', '안전핀을 뽑는다', true, 2, NOW(), NOW()),
('c092', 'q023', '흔들어 섞는다', false, 3, NOW(), NOW());

-- Q024 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c093', 'q024', '불길의 아래쪽', true, 0, NOW(), NOW()),
('c094', 'q024', '불길의 위쪽', false, 1, NOW(), NOW()),
('c095', 'q024', '천장을 향해', false, 2, NOW(), NOW()),
('c096', 'q024', '사방으로 뿌린다', false, 3, NOW(), NOW());

-- Q025 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c097', 'q025', '소화기를 찾는다', false, 0, NOW(), NOW()),
('c098', 'q025', '"불이야!" 하고 외친다', true, 1, NOW(), NOW()),
('c099', 'q025', '119에 전화한다', false, 2, NOW(), NOW()),
('c100', 'q025', '물을 찾는다', false, 3, NOW(), NOW());

-- Q026 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c101', 'q026', '빨리 뛰어간다', false, 0, NOW(), NOW()),
('c102', 'q026', '창문을 연다', false, 1, NOW(), NOW()),
('c103', 'q026', '자세를 낮추고 젖은 수건으로 입을 막는다', true, 2, NOW(), NOW()),
('c104', 'q026', '엘리베이터를 탄다', false, 3, NOW(), NOW());

-- Q027 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c105', 'q027', '정전으로 갇힐 수 있다', true, 0, NOW(), NOW()),
('c106', 'q027', '느려서', false, 1, NOW(), NOW()),
('c107', 'q027', '다른 사람이 사용해야 해서', false, 2, NOW(), NOW()),
('c108', 'q027', '법으로 금지되어서', false, 3, NOW(), NOW());

-- Q028 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c109', 'q028', '1미터', false, 0, NOW(), NOW()),
('c110', 'q028', '3~4미터', true, 1, NOW(), NOW()),
('c111', 'q028', '10미터', false, 2, NOW(), NOW()),
('c112', 'q028', '가까이 붙어서', false, 3, NOW(), NOW());

-- Q029 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c113', 'q029', '119에 신고한다', false, 0, NOW(), NOW()),
('c114', 'q029', '안전한 곳에서 대기한다', false, 1, NOW(), NOW()),
('c115', 'q029', '다시 건물 안으로 들어간다', true, 2, NOW(), NOW()),
('c116', 'q029', '소방관을 기다린다', false, 3, NOW(), NOW());

-- Q030 선택지
INSERT INTO "choices" ("id", "questionId", "text", "isAnswer", "order", "createdAt", "updatedAt")
VALUES 
('c117', 'q030', '119', true, 0, NOW(), NOW()),
('c118', 'q030', '112', false, 1, NOW(), NOW()),
('c119', 'q030', '110', false, 2, NOW(), NOW()),
('c120', 'q030', '114', false, 3, NOW(), NOW());

-- 8. 테스트용 학생 계정 생성 (비밀번호: Student123!)
INSERT INTO "users" ("id", "username", "passwordHash", "role", "name", "phone", "phoneVerifiedAt", "companyId", "createdAt", "updatedAt")
VALUES 
('student001', 'student1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '김철수', '01011111111', NOW(), 'company001', NOW(), NOW()),
('student002', 'student2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '이영희', '01022222222', NOW(), 'company001', NOW(), NOW()),
('student003', 'student3', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '박민수', '01033333333', NOW(), 'company001', NOW(), NOW());

-- 완료!
-- 이제 다음 계정으로 로그인할 수 있습니다:
-- 관리자: admin / Admin123!
-- 학생1: student1 / Student123!
-- 학생2: student2 / Student123!
-- 학생3: student3 / Student123!

