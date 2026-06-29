import type { Locale } from './config';

type LocaleText = Partial<Record<Locale, string>>;

export const studentTextTranslations: Record<string, LocaleText> = {
  '교육 플랫폼 로딩 중...': {
    en: 'Loading education platform...',
    th: 'กำลังโหลดแพลตฟอร์มการศึกษา...',
    bn: 'শিক্ষা প্ল্যাটফর্ম লোড হচ্ছে...',
  },
  '커리큘럼 페이지로 이동 중...': {
    en: 'Moving to the curriculum page...',
    th: 'กำลังไปยังหน้าหลักสูตร...',
    bn: 'কারিকুলাম পেজে নেওয়া হচ্ছে...',
  },
  '잠시만 기다려주세요.': {
    en: 'Please wait a moment.',
    th: 'กรุณารอสักครู่',
    bn: 'অনুগ্রহ করে একটু অপেক্ষা করুন।',
  },
  '강의실': { en: 'Classroom', th: 'ห้องเรียน', bn: 'ক্লাসরুম' },
  '내정보': { en: 'My Info', th: 'ข้อมูลของฉัน', bn: 'আমার তথ্য' },
  '교육안내': { en: 'Guide', th: 'คู่มือการเรียน', bn: 'শিক্ষা নির্দেশিকা' },
  'KIST 교육센터': {
    en: 'KIST Education Center',
    th: 'ศูนย์การศึกษา KIST',
    bn: 'KIST শিক্ষা কেন্দ্র',
  },
  '인증 확인 중...': {
    en: 'Checking authentication...',
    th: 'กำลังตรวจสอบการยืนยันตัวตน...',
    bn: 'প্রমাণীকরণ যাচাই হচ্ছে...',
  },
  '로딩 중...': { en: 'Loading...', th: 'กำลังโหลด...', bn: 'লোড হচ্ছে...' },
  '등록된 과목이 없습니다': {
    en: 'No subjects are registered',
    th: 'ยังไม่มีรายวิชาที่ลงทะเบียน',
    bn: 'কোনো বিষয় নিবন্ধিত নেই',
  },
  '관리자에게 커리큘럼 등록을 요청해주세요.': {
    en: 'Please ask an administrator to register your curriculum.',
    th: 'กรุณาขอให้ผู้ดูแลระบบลงทะเบียนหลักสูตรให้คุณ',
    bn: 'কারিকুলাম নিবন্ধনের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।',
  },
  '수강 기간': { en: 'Training Period', th: 'ระยะเวลาเรียน', bn: 'শিক্ষার সময়কাল' },
  '시작일:': { en: 'Start:', th: 'เริ่ม:', bn: 'শুরু:' },
  '종료일:': { en: 'End:', th: 'สิ้นสุด:', bn: 'শেষ:' },
  '남음': { en: 'left', th: 'คงเหลือ', bn: 'বাকি' },
  '수료': { en: 'Completed', th: 'สำเร็จแล้ว', bn: 'সম্পন্ন' },
  '미수료': { en: 'Not completed', th: 'ยังไม่สำเร็จ', bn: 'অসম্পন্ন' },
  '전체 진도율': { en: 'Overall Progress', th: 'ความคืบหน้ารวม', bn: 'মোট অগ্রগতি' },
  '강의 다시보기': { en: 'Review Lessons', th: 'ดูบทเรียนอีกครั้ง', bn: 'লেসন আবার দেখুন' },
  '강의 보기': { en: 'View Lessons', th: 'ดูบทเรียน', bn: 'লেসন দেখুন' },
  '강의 수강하기': { en: 'Start Lessons', th: 'เริ่มเรียน', bn: 'লেসন শুরু করুন' },
  '다시 수강하기': { en: 'Restart Course', th: 'เริ่มเรียนใหม่', bn: 'কোর্স আবার শুরু করুন' },
  '시험 보기': { en: 'Take Exam', th: 'ทำแบบทดสอบ', bn: 'পরীক্ষা দিন' },
  '3회 시험 기회를 모두 사용했습니다': {
    en: 'All 3 exam attempts have been used',
    th: 'ใช้สิทธิ์สอบครบ 3 ครั้งแล้ว',
    bn: '৩টি পরীক্ষার সুযোগই ব্যবহার করা হয়েছে',
  },
  '모든 강의 90% 이상 수강 시 시험 가능': {
    en: 'You can take the exam after completing at least 90% of every lesson.',
    th: 'ทำแบบทดสอบได้เมื่อเรียนทุกบทเรียนอย่างน้อย 90%',
    bn: 'সব লেসনের অন্তত ৯০% শেষ করলে পরীক্ষা দেওয়া যাবে।',
  },
  '최종 점수:': { en: 'Final score:', th: 'คะแนนสุดท้าย:', bn: 'চূড়ান্ত স্কোর:' },
  '커리큘럼': { en: 'Curriculum', th: 'หลักสูตร', bn: 'কারিকুলাম' },
  '커리큘럼으로': { en: 'Go to Curriculum', th: 'ไปยังหลักสูตร', bn: 'কারিকুলামে যান' },
  '커리큘럼으로 돌아가기': {
    en: 'Back to Curriculum',
    th: 'กลับไปยังหลักสูตร',
    bn: 'কারিকুলামে ফিরে যান',
  },
  '레슨을 찾을 수 없습니다': {
    en: 'Lesson not found',
    th: 'ไม่พบบทเรียน',
    bn: 'লেসন পাওয়া যায়নি',
  },
  '학습 진행 상황': { en: 'Learning Progress', th: 'ความคืบหน้าการเรียน', bn: 'শেখার অগ্রগতি' },
  '현재 진도율': { en: 'Current Progress', th: 'ความคืบหน้าปัจจุบัน', bn: 'বর্তমান অগ্রগতি' },
  '학습 상태': { en: 'Learning Status', th: 'สถานะการเรียน', bn: 'শেখার অবস্থা' },
  '완료': { en: 'Complete', th: 'เสร็จสิ้น', bn: 'সম্পন্ন' },
  '진행 중': { en: 'In progress', th: 'กำลังดำเนินการ', bn: 'চলমান' },
  '다음 레슨 상태': { en: 'Next Lesson Status', th: 'สถานะบทเรียนถัดไป', bn: 'পরবর্তী লেসনের অবস্থা' },
  '완료 후': { en: 'After completing', th: 'หลังจากเรียนจบ', bn: 'সম্পন্ন করার পর' },
  '다음 레슨이 해금됩니다.': {
    en: 'the next lesson will be unlocked.',
    th: 'บทเรียนถัดไปจะถูกปลดล็อก',
    bn: 'পরবর্তী লেসন আনলক হবে।',
  },
  '접근 제한': { en: 'Access Restricted', th: 'จำกัดการเข้าถึง', bn: 'প্রবেশ সীমাবদ্ধ' },
  '시험 안내': { en: 'Exam Guide', th: 'คำแนะนำการสอบ', bn: 'পরীক্ষার নির্দেশনা' },
  '과목의': { en: 'When you complete', th: 'เมื่อคุณเรียน', bn: 'বিষয়ের' },
  '모든 레슨': { en: 'all lessons', th: 'ทุกบทเรียน', bn: 'সব লেসন' },
  '을 90% 이상 완료하면': {
    en: 'by at least 90%,',
    th: 'อย่างน้อย 90%',
    bn: 'কমপক্ষে ৯০% সম্পন্ন করলে',
  },
  '커리큘럼 페이지': { en: 'the curriculum page', th: 'หน้าหลักสูตร', bn: 'কারিকুলাম পেজ' },
  '에서 시험을 응시할 수 있습니다.': {
    en: 'will let you take the exam.',
    th: 'คุณจะสามารถทำแบบทดสอบได้',
    bn: 'থেকে পরীক্ষা দিতে পারবেন।',
  },
  '회사 배정': { en: 'Company Assignment', th: 'กำหนดบริษัท', bn: 'কোম্পানি বরাদ্দ' },
  '회사 코드': { en: 'Company Code', th: 'รหัสบริษัท', bn: 'কোম্পানি কোড' },
  '회사 코드를 입력하여': {
    en: 'Enter your company code',
    th: 'กรอกรหัสบริษัท',
    bn: 'কোম্পানি কোড লিখুন',
  },
  '소속 회사를 등록해주세요': {
    en: 'to register your company.',
    th: 'เพื่อลงทะเบียนบริษัทของคุณ',
    bn: 'আপনার কোম্পানি নিবন্ধন করতে।',
  },
  '회사 코드는 관리자로부터 받으실 수 있습니다': {
    en: 'You can get the company code from your administrator.',
    th: 'ขอรหัสบริษัทได้จากผู้ดูแลระบบ',
    bn: 'কোম্পানি কোড অ্যাডমিনের কাছ থেকে পাবেন।',
  },
  '6자리 영문과 숫자 조합': {
    en: '6 letters and numbers',
    th: 'ตัวอักษรและตัวเลข 6 ตัว',
    bn: '৬ অক্ষর ও সংখ্যার সমন্বয়',
  },
  '배정 중...': { en: 'Assigning...', th: 'กำลังกำหนด...', bn: 'বরাদ্দ হচ্ছে...' },
  '회사 배정하기': { en: 'Assign Company', th: 'กำหนดบริษัท', bn: 'কোম্পানি বরাদ্দ করুন' },
  '나중에 배정하기 (로그아웃)': {
    en: 'Assign later (log out)',
    th: 'กำหนดภายหลัง (ออกจากระบบ)',
    bn: 'পরে বরাদ্দ করুন (লগ আউট)',
  },
  '배정 완료!': { en: 'Assignment Complete!', th: 'กำหนดเรียบร้อย!', bn: 'বরাদ্দ সম্পন্ন!' },
  '회사에 성공적으로 배정되었습니다': {
    en: 'You have been assigned to the company.',
    th: 'คุณถูกกำหนดเข้าบริษัทเรียบร้อยแล้ว',
    bn: 'আপনাকে কোম্পানিতে বরাদ্দ করা হয়েছে।',
  },
  '환영합니다!': { en: 'Welcome!', th: 'ยินดีต้อนรับ!', bn: 'স্বাগতম!' },
  '이제 학습을 시작할 수 있습니다.': {
    en: 'You can now start learning.',
    th: 'คุณสามารถเริ่มเรียนได้แล้ว',
    bn: 'আপনি এখন শেখা শুরু করতে পারেন।',
  },
  '3초 후 자동으로 학습 페이지로 이동합니다...': {
    en: 'You will move to the learning page in 3 seconds...',
    th: 'ระบบจะไปยังหน้าเรียนใน 3 วินาที...',
    bn: '৩ সেকেন্ড পরে শেখার পেজে নেওয়া হবে...',
  },
  '바로 시작하기': { en: 'Start Now', th: 'เริ่มทันที', bn: 'এখনই শুরু করুন' },
  '회원가입': { en: 'Sign Up', th: 'สมัครสมาชิก', bn: 'নিবন্ধন' },
  '교육 플랫폼에서 학습을 시작하세요': {
    en: 'Start learning on the education platform.',
    th: 'เริ่มเรียนบนแพลตฟอร์มการศึกษา',
    bn: 'শিক্ষা প্ল্যাটফর্মে শেখা শুরু করুন।',
  },
  '이미 계정이 있으신가요?': {
    en: 'Already have an account?',
    th: 'มีบัญชีอยู่แล้วใช่ไหม?',
    bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
  },
  '로그인': { en: 'Log in', th: 'เข้าสู่ระบบ', bn: 'লগ ইন' },
  '휴대폰 번호': { en: 'Phone Number', th: 'หมายเลขโทรศัพท์', bn: 'মোবাইল নম্বর' },
  '인증번호 받기': { en: 'Get Verification Code', th: 'รับรหัสยืนยัน', bn: 'যাচাইকরণ কোড নিন' },
  '인증번호 전송 중...': {
    en: 'Sending code...',
    th: 'กำลังส่งรหัส...',
    bn: 'কোড পাঠানো হচ্ছে...',
  },
  '인증번호 입력': { en: 'Enter Verification Code', th: 'กรอกรหัสยืนยัน', bn: 'যাচাইকরণ কোড লিখুন' },
  '으로 전송된 6자리 인증번호를 입력해주세요': {
    en: 'Enter the 6-digit code sent to this number.',
    th: 'กรอกรหัส 6 หลักที่ส่งไปยังหมายเลขนี้',
    bn: 'এই নম্বরে পাঠানো ৬ সংখ্যার কোড লিখুন।',
  },
  '인증번호를 받지 못하셨나요?': {
    en: 'Didn’t receive the code?',
    th: 'ไม่ได้รับรหัสใช่ไหม?',
    bn: 'কোড পাননি?',
  },
  '재전송': { en: 'Resend', th: 'ส่งอีกครั้ง', bn: 'আবার পাঠান' },
  '번호 변경': { en: 'Change Number', th: 'เปลี่ยนหมายเลข', bn: 'নম্বর পরিবর্তন' },
  '인증 중...': { en: 'Verifying...', th: 'กำลังยืนยัน...', bn: 'যাচাই হচ্ছে...' },
  '인증 확인': { en: 'Verify', th: 'ยืนยัน', bn: 'যাচাই করুন' },
  '이름 *': { en: 'Name *', th: 'ชื่อ *', bn: 'নাম *' },
  '비밀번호 *': { en: 'Password *', th: 'รหัสผ่าน *', bn: 'পাসওয়ার্ড *' },
  '비밀번호 확인 *': {
    en: 'Confirm Password *',
    th: 'ยืนยันรหัสผ่าน *',
    bn: 'পাসওয়ার্ড নিশ্চিত করুন *',
  },
  '초대코드 (선택)': { en: 'Invite Code (Optional)', th: 'รหัสเชิญ (ไม่บังคับ)', bn: 'আমন্ত্রণ কোড (ঐচ্ছিক)' },
  '비밀번호 조건': { en: 'Password Requirements', th: 'เงื่อนไขรหัสผ่าน', bn: 'পাসওয়ার্ডের শর্ত' },
  '최소 8자 이상': { en: 'At least 8 characters', th: 'อย่างน้อย 8 ตัวอักษร', bn: 'কমপক্ষে ৮ অক্ষর' },
  '소문자 포함': { en: 'Include lowercase', th: 'มีตัวพิมพ์เล็ก', bn: 'ছোট হাতের অক্ষর থাকতে হবে' },
  '대문자 포함': { en: 'Include uppercase', th: 'มีตัวพิมพ์ใหญ่', bn: 'বড় হাতের অক্ষর থাকতে হবে' },
  '숫자 포함': { en: 'Include a number', th: 'มีตัวเลข', bn: 'সংখ্যা থাকতে হবে' },
  '특수문자 포함': { en: 'Include a special character', th: 'มีอักขระพิเศษ', bn: 'বিশেষ অক্ষর থাকতে হবে' },
  '초대코드가 있으면 해당 회사로 자동 배정됩니다': {
    en: 'If you have an invite code, you will be assigned to that company automatically.',
    th: 'หากมีรหัสเชิญ ระบบจะกำหนดบริษัทให้อัตโนมัติ',
    bn: 'আমন্ত্রণ কোড থাকলে আপনাকে স্বয়ংক্রিয়ভাবে সেই কোম্পানিতে বরাদ্দ করা হবে।',
  },
  '[필수]': { en: '[Required]', th: '[จำเป็น]', bn: '[আবশ্যক]' },
  '개인정보 처리방침': { en: 'Privacy Policy', th: 'นโยบายความเป็นส่วนตัว', bn: 'গোপনীয়তা নীতি' },
  '에 동의합니다.': { en: 'I agree.', th: 'ฉันยอมรับ', bn: 'আমি সম্মত।' },
  '이전': { en: 'Back', th: 'ย้อนกลับ', bn: 'পেছনে' },
  '회원가입 중...': { en: 'Signing up...', th: 'กำลังสมัคร...', bn: 'নিবন্ধন হচ্ছে...' },
  '회원가입 완료': { en: 'Complete Sign Up', th: 'สมัครให้เสร็จ', bn: 'নিবন্ধন সম্পন্ন করুন' },
  '회원가입이 완료되었습니다!': {
    en: 'Sign up is complete!',
    th: 'สมัครสมาชิกเสร็จสมบูรณ์!',
    bn: 'নিবন্ধন সম্পন্ন হয়েছে!',
  },
  '교육 플랫폼에 오신 것을 환영합니다.': {
    en: 'Welcome to the education platform.',
    th: 'ยินดีต้อนรับสู่แพลตฟอร์มการศึกษา',
    bn: 'শিক্ষা প্ল্যাটফর্মে স্বাগতম।',
  },
  '가입 정보': { en: 'Account Information', th: 'ข้อมูลการสมัคร', bn: 'নিবন্ধন তথ্য' },
  '휴대폰번호:': { en: 'Phone:', th: 'โทรศัพท์:', bn: 'ফোন:' },
  '이름:': { en: 'Name:', th: 'ชื่อ:', bn: 'নাম:' },
  '초대코드:': { en: 'Invite Code:', th: 'รหัสเชิญ:', bn: 'আমন্ত্রণ কোড:' },
  '문제가 있으시거나 도움이 필요하시면': {
    en: 'If you have any issue or need help,',
    th: 'หากมีปัญหาหรือต้องการความช่วยเหลือ',
    bn: 'সমস্যা হলে বা সাহায্য দরকার হলে',
  },
  '언제든지 고객지원팀에 문의해주세요.': {
    en: 'please contact support at any time.',
    th: 'ติดต่อทีมสนับสนุนได้ทุกเมื่อ',
    bn: 'যেকোনো সময় সহায়তা টিমের সাথে যোগাযোগ করুন।',
  },
  '비밀번호 찾기': { en: 'Find Password', th: 'ค้นหารหัสผ่าน', bn: 'পাসওয়ার্ড খুঁজুন' },
  '가입 시 등록한 휴대폰 번호를 입력해주세요.': {
    en: 'Enter the phone number you used when signing up.',
    th: 'กรอกหมายเลขโทรศัพท์ที่ใช้สมัคร',
    bn: 'নিবন্ধনের সময় ব্যবহৃত মোবাইল নম্বর লিখুন।',
  },
  '전송 중...': { en: 'Sending...', th: 'กำลังส่ง...', bn: 'পাঠানো হচ্ছে...' },
  '로그인으로 돌아가기': { en: 'Back to Login', th: 'กลับไปเข้าสู่ระบบ', bn: 'লগইনে ফিরুন' },
  '확인 중...': { en: 'Checking...', th: 'กำลังตรวจสอบ...', bn: 'যাচাই হচ্ছে...' },
  '인증번호 재전송': { en: 'Resend Code', th: 'ส่งรหัสอีกครั้ง', bn: 'কোড আবার পাঠান' },
  '새 비밀번호 설정': { en: 'Set New Password', th: 'ตั้งรหัสผ่านใหม่', bn: 'নতুন পাসওয়ার্ড সেট করুন' },
  '새로운 비밀번호를 입력해주세요.': {
    en: 'Enter your new password.',
    th: 'กรอกรหัสผ่านใหม่',
    bn: 'নতুন পাসওয়ার্ড লিখুন।',
  },
  '새 비밀번호': { en: 'New Password', th: 'รหัสผ่านใหม่', bn: 'নতুন পাসওয়ার্ড' },
  '비밀번호 확인': { en: 'Confirm Password', th: 'ยืนยันรหัสผ่าน', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
  '비밀번호 규칙:': { en: 'Password rules:', th: 'กฎรหัสผ่าน:', bn: 'পাসওয়ার্ড নিয়ম:' },
  '대문자, 소문자 각 1개 이상': {
    en: 'At least one uppercase and lowercase letter',
    th: 'มีตัวพิมพ์ใหญ่และตัวพิมพ์เล็กอย่างน้อยอย่างละ 1 ตัว',
    bn: 'কমপক্ষে একটি বড় ও একটি ছোট হাতের অক্ষর',
  },
  '숫자 1개 이상': { en: 'At least one number', th: 'ตัวเลขอย่างน้อย 1 ตัว', bn: 'কমপক্ষে একটি সংখ্যা' },
  '특수문자 1개 이상': {
    en: 'At least one special character',
    th: 'อักขระพิเศษอย่างน้อย 1 ตัว',
    bn: 'কমপক্ষে একটি বিশেষ অক্ষর',
  },
  '변경 중...': { en: 'Changing...', th: 'กำลังเปลี่ยน...', bn: 'পরিবর্তন হচ্ছে...' },
  '비밀번호 변경': { en: 'Change Password', th: 'เปลี่ยนรหัสผ่าน', bn: 'পাসওয়ার্ড পরিবর্তন' },
  '비밀번호 변경 완료': {
    en: 'Password Changed',
    th: 'เปลี่ยนรหัสผ่านเรียบร้อย',
    bn: 'পাসওয়ার্ড পরিবর্তন হয়েছে',
  },
  '새 비밀번호로 로그인해주세요.': {
    en: 'Please log in with your new password.',
    th: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    bn: 'নতুন পাসওয়ার্ড দিয়ে লগ ইন করুন।',
  },
  '로그인하러 가기': { en: 'Go to Login', th: 'ไปเข้าสู่ระบบ', bn: 'লগইনে যান' },
  '시험을 준비 중입니다...': {
    en: 'Preparing the exam...',
    th: 'กำลังเตรียมแบบทดสอบ...',
    bn: 'পরীক্ষা প্রস্তুত হচ্ছে...',
  },
  '시험 데이터를 불러올 수 없습니다.': {
    en: 'Could not load exam data.',
    th: 'ไม่สามารถโหลดข้อมูลแบบทดสอบได้',
    bn: 'পরীক্ষার ডেটা লোড করা যায়নি।',
  },
  '과목': { en: 'Subject', th: 'รายวิชา', bn: 'বিষয়' },
  '시험': { en: 'Exam', th: 'แบบทดสอบ', bn: 'পরীক্ষা' },
  '모든 문제에 답변한 후 제출해주세요': {
    en: 'Answer all questions before submitting.',
    th: 'กรุณาตอบทุกคำถามก่อนส่ง',
    bn: 'জমা দেওয়ার আগে সব প্রশ্নের উত্তর দিন।',
  },
  '시험 차수': { en: 'Attempt', th: 'ครั้งที่สอบ', bn: 'চেষ্টা' },
  '남은 기회': { en: 'Attempts Left', th: 'โอกาสที่เหลือ', bn: 'বাকি সুযোগ' },
  '취소': { en: 'Cancel', th: 'ยกเลิก', bn: 'বাতিল' },
  '제출 중...': { en: 'Submitting...', th: 'กำลังส่ง...', bn: 'জমা হচ্ছে...' },
  '시험 제출': { en: 'Submit Exam', th: 'ส่งแบบทดสอบ', bn: 'পরীক্ষা জমা দিন' },
  '시험을 시작할 수 없습니다': {
    en: 'Cannot start the exam',
    th: 'ไม่สามารถเริ่มแบบทดสอบได้',
    bn: 'পরীক্ষা শুরু করা যাচ্ছে না',
  },
  '이 레슨에 접근할 권한이 없습니다.': {
    en: 'You do not have access to this lesson.',
    th: 'คุณไม่มีสิทธิ์เข้าถึงบทเรียนนี้',
    bn: 'এই লেসনে আপনার প্রবেশাধিকার নেই।',
  },
  '레슨 진도가 90% 이상이어야 시험을 볼 수 있습니다.': {
    en: 'You need at least 90% lesson progress to take the exam.',
    th: 'ต้องเรียนบทเรียนอย่างน้อย 90% จึงจะสอบได้',
    bn: 'পরীক্ষা দিতে লেসনের অগ্রগতি অন্তত ৯০% হতে হবে।',
  },
  '레슨으로 돌아가기': { en: 'Back to Lesson', th: 'กลับไปบทเรียน', bn: 'লেসনে ফিরে যান' },
  '시험 조건 확인': { en: 'Exam Requirements', th: 'ตรวจสอบเงื่อนไขสอบ', bn: 'পরীক্ষার শর্ত' },
  '시험 준비 중...': { en: 'Preparing exam...', th: 'กำลังเตรียมสอบ...', bn: 'পরীক্ষা প্রস্তুত হচ্ছে...' },
  '응시 기회 소진': { en: 'No Attempts Left', th: 'ไม่มีโอกาสสอบเหลือ', bn: 'কোনো সুযোগ বাকি নেই' },
  '시험 시작': { en: 'Start Exam', th: 'เริ่มสอบ', bn: 'পরীক্ষা শুরু' },
  '이전 문제': { en: 'Previous', th: 'ข้อก่อนหน้า', bn: 'আগের প্রশ্ন' },
  '다음 문제': { en: 'Next', th: 'ข้อถัดไป', bn: 'পরবর্তী প্রশ্ন' },
  '제출하기': { en: 'Submit', th: 'ส่ง', bn: 'জমা দিন' },
  '시험을 종료하시겠습니까?': {
    en: 'Do you want to exit the exam?',
    th: 'ต้องการออกจากแบบทดสอบหรือไม่?',
    bn: 'আপনি কি পরীক্ষা ছাড়তে চান?',
  },
  '진행 상황이 저장되지 않습니다.': {
    en: 'Your progress will not be saved.',
    th: 'ความคืบหน้าจะไม่ถูกบันทึก',
    bn: 'আপনার অগ্রগতি সংরক্ষণ হবে না।',
  },
  '계속 진행': { en: 'Continue', th: 'ทำต่อ', bn: 'চালিয়ে যান' },
  '종료': { en: 'Exit', th: 'ออก', bn: 'বের হন' },
  '시험을 제출하고 있습니다...': {
    en: 'Submitting your exam...',
    th: 'กำลังส่งแบบทดสอบ...',
    bn: 'পরীক্ষা জমা হচ্ছে...',
  },
  '결과를 찾을 수 없습니다': {
    en: 'Result not found',
    th: 'ไม่พบผลลัพธ์',
    bn: 'ফলাফল পাওয়া যায়নি',
  },
  '과목 수료!': { en: 'Subject Completed!', th: 'สำเร็จรายวิชา!', bn: 'বিষয় সম্পন্ন!' },
  '아쉽지만 수료 기준에 미달했습니다.': {
    en: 'You did not meet the completion requirement.',
    th: 'ยังไม่ผ่านเกณฑ์สำเร็จ',
    bn: 'আপনি সম্পন্ন করার শর্ত পূরণ করেননি।',
  },
  '축하합니다! 과목을 수료하셨습니다!': {
    en: 'Congratulations! You completed the subject!',
    th: 'ยินดีด้วย! คุณสำเร็จรายวิชาแล้ว!',
    bn: 'অভিনন্দন! আপনি বিষয়টি সম্পন্ন করেছেন!',
  },
  '과목 총점': { en: 'Final Subject Score', th: 'คะแนนรวมรายวิชา', bn: 'বিষয়ের মোট স্কোর' },
  '상세 정보 숨기기': { en: 'Hide Details', th: 'ซ่อนรายละเอียด', bn: 'বিস্তারিত লুকান' },
  '상세 정보 보기': { en: 'View Details', th: 'ดูรายละเอียด', bn: 'বিস্তারিত দেখুন' },
  '시도 ID': { en: 'Attempt ID', th: 'ID การสอบ', bn: 'চেষ্টা ID' },
  '수료 기준': { en: 'Completion Criteria', th: 'เกณฑ์สำเร็จ', bn: 'সম্পন্নের মানদণ্ড' },
  '남은 시험 기회': { en: 'Exam Attempts Left', th: 'โอกาสสอบที่เหลือ', bn: 'বাকি পরীক্ষার সুযোগ' },
  '총 문항 수': { en: 'Total Questions', th: 'จำนวนคำถามทั้งหมด', bn: 'মোট প্রশ্ন' },
  '과목을 수료하셨습니다!': {
    en: 'You completed the subject!',
    th: 'คุณสำเร็จรายวิชาแล้ว!',
    bn: 'আপনি বিষয়টি সম্পন্ন করেছেন!',
  },
  '다른 과목을 확인하거나 강의를 복습해보세요.': {
    en: 'Check other subjects or review lessons.',
    th: 'ดูรายวิชาอื่นหรือทบทวนบทเรียน',
    bn: 'অন্য বিষয় দেখুন বা লেসন পুনরায় দেখুন।',
  },
  '재응시하기': { en: 'Retake Exam', th: 'สอบอีกครั้ง', bn: 'আবার পরীক্ষা দিন' },
  '시험 기회를 모두 사용했습니다': {
    en: 'All exam attempts have been used',
    th: 'ใช้โอกาสสอบครบแล้ว',
    bn: 'সব পরীক্ষার সুযোগ ব্যবহার হয়েছে',
  },
  '과목을 다시 수강하면 3회의 새로운 시험 기회가 주어집니다.': {
    en: 'Restarting the subject gives you 3 new exam attempts.',
    th: 'เมื่อเริ่มเรียนรายวิชาใหม่ คุณจะได้โอกาสสอบใหม่ 3 ครั้ง',
    bn: 'বিষয়টি আবার শুরু করলে ৩টি নতুন পরীক্ষার সুযোগ পাবেন।',
  },
  '초기화 중...': { en: 'Resetting...', th: 'กำลังรีเซ็ต...', bn: 'রিসেট হচ্ছে...' },
  '다음 단계': { en: 'Next Steps', th: 'ขั้นตอนต่อไป', bn: 'পরবর্তী ধাপ' },
  '다른 과목을 수강하거나 강의를 복습하세요': {
    en: 'Take another subject or review lessons.',
    th: 'เรียนรายวิชาอื่นหรือทบทวนบทเรียน',
    bn: 'অন্য বিষয় নিন বা লেসন পুনরায় দেখুন।',
  },
  '커리큘럼에서 전체 진도를 확인하세요': {
    en: 'Check your full progress in the curriculum.',
    th: 'ตรวจสอบความคืบหน้าทั้งหมดในหลักสูตร',
    bn: 'কারিকুলামে আপনার মোট অগ্রগতি দেখুন।',
  },
  '강의 내용을 다시 복습해보세요': {
    en: 'Review the lesson content again.',
    th: 'ทบทวนเนื้อหาบทเรียนอีกครั้ง',
    bn: 'লেসনের বিষয়বস্তু আবার পর্যালোচনা করুন।',
  },
  '과목을 다시 수강하여 새로운 시험 기회를 받으세요': {
    en: 'Restart the subject to receive new exam attempts.',
    th: 'เริ่มเรียนรายวิชาใหม่เพื่อรับโอกาสสอบใหม่',
    bn: 'নতুন পরীক্ষার সুযোগ পেতে বিষয়টি আবার শুরু করুন।',
  },
  '모든 강의를 90% 이상 수강하면 다시 시험을 볼 수 있습니다': {
    en: 'You can take the exam again after completing at least 90% of every lesson.',
    th: 'คุณจะสอบใหม่ได้หลังเรียนทุกบทเรียนอย่างน้อย 90%',
    bn: 'সব লেসনের অন্তত ৯০% সম্পন্ন করলে আবার পরীক্ষা দিতে পারবেন।',
  },
  '내 정보': { en: 'My Information', th: 'ข้อมูลของฉัน', bn: 'আমার তথ্য' },
  '계정 정보와 소속, 교육기간을 확인할 수 있습니다.': {
    en: 'Check your account, company, and training period.',
    th: 'ตรวจสอบบัญชี บริษัท และระยะเวลาเรียนของคุณ',
    bn: 'আপনার অ্যাকাউন্ট, কোম্পানি ও শিক্ষার সময়কাল দেখুন।',
  },
  '로그아웃': { en: 'Log out', th: 'ออกจากระบบ', bn: 'লগ আউট' },
  '내 정보를 불러오는 중입니다...': {
    en: 'Loading your information...',
    th: 'กำลังโหลดข้อมูลของคุณ...',
    bn: 'আপনার তথ্য লোড হচ্ছে...',
  },
  '기본 정보': { en: 'Basic Information', th: 'ข้อมูลพื้นฐาน', bn: 'মৌলিক তথ্য' },
  '이름': { en: 'Name', th: 'ชื่อ', bn: 'নাম' },
  '아이디': { en: 'ID', th: 'ID', bn: 'আইডি' },
  '역할': { en: 'Role', th: 'บทบาท', bn: 'ভূমিকা' },
  '관리자': { en: 'Admin', th: 'ผู้ดูแลระบบ', bn: 'অ্যাডমিন' },
  '소속 및 교육기간': { en: 'Company and Training Period', th: 'บริษัทและระยะเวลาเรียน', bn: 'কোম্পানি ও শিক্ষার সময়কাল' },
  '소속 회사': { en: 'Company', th: 'บริษัท', bn: 'কোম্পানি' },
  '회사 정보 없음': { en: 'No company information', th: 'ไม่มีข้อมูลบริษัท', bn: 'কোম্পানির তথ্য নেই' },
  '미배정': { en: 'Not assigned', th: 'ยังไม่ได้กำหนด', bn: 'বরাদ্দ হয়নি' },
  '진행 중인 교육': { en: 'Active training', th: 'การเรียนที่กำลังดำเนินอยู่', bn: 'চলমান শিক্ষা' },
  '비활성 회사': { en: 'Inactive company', th: 'บริษัทไม่ใช้งาน', bn: 'নিষ্ক্রিয় কোম্পানি' },
  '회사 배정 상태를 확인해주세요.': {
    en: 'Please check your company assignment status.',
    th: 'กรุณาตรวจสอบสถานะการกำหนดบริษัท',
    bn: 'আপনার কোম্পানি বরাদ্দের অবস্থা 확인 করুন।',
  },
  '교육 시작일': { en: 'Training Start Date', th: 'วันเริ่มเรียน', bn: 'শিক্ষা শুরুর তারিখ' },
  '교육 종료일': { en: 'Training End Date', th: 'วันสิ้นสุดการเรียน', bn: 'শিক্ষা শেষের তারিখ' },
  '기타': { en: 'Other', th: 'อื่นๆ', bn: 'অন্যান্য' },
  '강의실에서 학습 진도와 시험 결과를 확인하실 수 있습니다.': {
    en: 'You can check your learning progress and exam results in the classroom.',
    th: 'คุณสามารถตรวจสอบความคืบหน้าและผลสอบได้ในห้องเรียน',
    bn: 'ক্লাসরুমে শেখার অগ্রগতি ও পরীক্ষার ফলাফল দেখতে পারবেন।',
  },
  '강의실로 이동': { en: 'Go to Classroom', th: 'ไปห้องเรียน', bn: 'ক্লাসরুমে যান' },
  '교육소개 및 수강 안내': {
    en: 'Training Introduction and Guide',
    th: 'แนะนำการศึกษาและคู่มือการเรียน',
    bn: 'শিক্ষা পরিচিতি ও নির্দেশিকা',
  },
  '교육기관 소개': { en: 'About the Institution', th: 'เกี่ยวกับสถาบัน', bn: 'প্রতিষ্ঠান পরিচিতি' },
  '한국산업보건안전기술원 온라인 교육센터는 산업재해 예방과 안전문화 정착을 목표로,': {
    en: 'The Korea Occupational Health and Safety Technology Institute Online Education Center aims to prevent industrial accidents and build a safety culture.',
    th: 'ศูนย์การศึกษาออนไลน์ของสถาบันเทคโนโลยีอาชีวอนามัยและความปลอดภัยแห่งเกาหลีมุ่งป้องกันอุบัติเหตุจากการทำงานและสร้างวัฒนธรรมความปลอดภัย',
    bn: 'কোরিয়া অকুপেশনাল হেলথ অ্যান্ড সেফটি টেকনোলজি ইনস্টিটিউট অনলাইন শিক্ষা কেন্দ্র শিল্প দুর্ঘটনা প্রতিরোধ ও নিরাপত্তা সংস্কৃতি গড়ে তুলতে কাজ করে।',
  },
  '사업장 현장에서 바로 활용 가능한 실무 중심의 안전보건 교육을 제공합니다.': {
    en: 'It provides practical safety and health training that can be used directly at worksites.',
    th: 'ให้การอบรมความปลอดภัยและอาชีวอนามัยเชิงปฏิบัติที่ใช้ได้จริงในสถานประกอบการ',
    bn: 'এটি কর্মক্ষেত্রে সরাসরি ব্যবহারযোগ্য বাস্তবভিত্তিক নিরাপত্তা ও স্বাস্থ্য শিক্ষা প্রদান করে।',
  },
  '산업안전보건법령에서 요구하는 법정·위탁 교육 과정을 체계적으로 운영하고 있습니다.': {
    en: 'It systematically operates legally required and commissioned training under occupational safety and health laws.',
    th: 'ดำเนินหลักสูตรตามกฎหมายและหลักสูตรที่ได้รับมอบหมายตามกฎหมายความปลอดภัยและอาชีวอนามัยอย่างเป็นระบบ',
    bn: 'এটি পেশাগত নিরাপত্তা ও স্বাস্থ্য আইনে প্রয়োজনীয় আইনগত ও委託 শিক্ষা পদ্ধতিগতভাবে পরিচালনা করে।',
  },
  '교육기간': { en: 'Training Period', th: 'ระยะเวลาเรียน', bn: 'শিক্ষার সময়কাল' },
  '교육기간은 회사(고객사) 단위로 설정되며, 시작일 기준 6개월 동안 수강이 가능합니다.': {
    en: 'The training period is set by company and is available for 6 months from the start date.',
    th: 'ระยะเวลาเรียนกำหนดตามบริษัท และสามารถเรียนได้ 6 เดือนนับจากวันเริ่มต้น',
    bn: 'শিক্ষার সময়কাল কোম্পানি অনুযায়ী নির্ধারিত হয় এবং শুরু তারিখ থেকে ৬ মাস শেখা যায়।',
  },
  '수강기간 내에는 자유롭게 로그인하여 학습 및 평가를 진행하실 수 있습니다.': {
    en: 'During the period, you can log in freely to learn and complete assessments.',
    th: 'ในช่วงเวลาเรียน คุณสามารถเข้าสู่ระบบเพื่อเรียนและทำแบบประเมินได้อย่างอิสระ',
    bn: 'সময়কালের মধ্যে আপনি লগ ইন করে শেখা ও মূল্যায়ন সম্পন্ন করতে পারবেন।',
  },
  '수강기간이 종료되면 신규 수강 및 평가 응시는 제한될 수 있습니다.': {
    en: 'After the period ends, new learning and assessments may be restricted.',
    th: 'เมื่อสิ้นสุดระยะเวลาเรียน การเรียนใหม่และการสอบอาจถูกจำกัด',
    bn: 'সময়কাল শেষ হলে নতুন শেখা ও মূল্যায়ন সীমিত হতে পারে।',
  },
  '교육방법': { en: 'Training Method', th: 'วิธีการเรียน', bn: 'শিক্ষা পদ্ধতি' },
  '100% 온라인 동영상 기반 이러닝 교육으로 제공됩니다.': {
    en: 'Training is provided as 100% online video-based e-learning.',
    th: 'การเรียนเป็นอีเลิร์นนิงแบบวิดีโอออนไลน์ 100%',
    bn: 'শিক্ষা ১০০% অনলাইন ভিডিওভিত্তিক ই-লার্নিং হিসেবে 제공 করা হয়।',
  },
  '각 과목은 여러 개의 강의(레슨)으로 구성되며, 레슨별 학습 진도율이 자동으로 기록됩니다.': {
    en: 'Each subject consists of multiple lessons, and progress is recorded automatically for each lesson.',
    th: 'แต่ละรายวิชาประกอบด้วยหลายบทเรียน และระบบจะบันทึกความคืบหน้าของแต่ละบทเรียนโดยอัตโนมัติ',
    bn: 'প্রতিটি বিষয় একাধিক লেসন নিয়ে গঠিত এবং প্রতিটি লেসনের অগ্রগতি স্বয়ংক্রিয়ভাবে রেকর্ড হয়।',
  },
  '레슨 진도율은 동영상 시청 시간 기준으로 계산되며, 90% 이상 수강 시 ‘수강 완료’로 반영됩니다.': {
    en: 'Lesson progress is calculated by video watch time, and 90% or more is marked as complete.',
    th: 'ความคืบหน้าคำนวณจากเวลาชมวิดีโอ และเมื่อเรียน 90% ขึ้นไปจะถือว่าสำเร็จ',
    bn: 'লেসনের অগ্রগতি ভিডিও দেখার সময় অনুযায়ী গণনা হয় এবং ৯০% বা বেশি হলে সম্পন্ন হিসেবে গণ্য হয়।',
  },
  '교육진행절차': { en: 'Training Process', th: 'ขั้นตอนการเรียน', bn: 'শিক্ষা প্রক্রিয়া' },
  '회원가입 및 로그인': { en: 'Sign Up and Log In', th: 'สมัครและเข้าสู่ระบบ', bn: 'নিবন্ধন ও লগ ইন' },
  '회사에서 안내받은 방식에 따라 회원가입 후 로그인합니다.': {
    en: 'Sign up and log in according to the instructions from your company.',
    th: 'สมัครและเข้าสู่ระบบตามคำแนะนำจากบริษัท',
    bn: 'আপনার কোম্পানির নির্দেশনা অনুযায়ী নিবন্ধন করে লগ ইন করুন।',
  },
  '강의실 접속': { en: 'Enter the Classroom', th: 'เข้าสู่ห้องเรียน', bn: 'ক্লাসরুমে প্রবেশ' },
  '상단 내비게이션의 「강의실」 메뉴에서 배정된 교육과정을 확인합니다.': {
    en: 'Check your assigned training in the Classroom menu at the top.',
    th: 'ตรวจสอบหลักสูตรที่ได้รับมอบหมายจากเมนูห้องเรียนด้านบน',
    bn: 'উপরের ক্লাসরুম মেনুতে বরাদ্দকৃত শিক্ষা 과정 দেখুন।',
  },
  '동영상 학습': { en: 'Video Learning', th: 'เรียนผ่านวิดีโอ', bn: 'ভিডিও শিক্ষা' },
  '각 레슨의 동영상을 시청하며, 시청 시간에 따라 진도율이 자동으로 저장됩니다.': {
    en: 'Watch each lesson video. Progress is saved automatically based on watch time.',
    th: 'ชมวิดีโอแต่ละบทเรียน ระบบจะบันทึกความคืบหน้าตามเวลาที่ชมโดยอัตโนมัติ',
    bn: 'প্রতিটি লেসনের ভিডিও দেখুন। দেখার সময় অনুযায়ী অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।',
  },
  '학습평가(시험) 응시': { en: 'Take Assessment (Exam)', th: 'ทำแบบประเมิน (สอบ)', bn: 'মূল্যায়ন (পরীক্ষা) দিন' },
  '해당 레슨 진도율이 90% 이상일 때 레슨 시험에 응시할 수 있습니다.': {
    en: 'You can take the lesson exam when that lesson progress is at least 90%.',
    th: 'สามารถสอบบทเรียนได้เมื่อความคืบหน้าบทเรียนนั้นอย่างน้อย 90%',
    bn: 'সেই লেসনের অগ্রগতি অন্তত ৯০% হলে লেসন পরীক্ষা দিতে পারবেন।',
  },
  '진도율과 학습평가 점수를 반영한 최종 점수가 수료 기준을 충족하면 교육을 수료하게 됩니다.': {
    en: 'Training is completed when the final score from progress and assessment meets the requirement.',
    th: 'สำเร็จการเรียนเมื่อคะแนนรวมจากความคืบหน้าและแบบประเมินผ่านเกณฑ์',
    bn: 'অগ্রগতি ও মূল্যায়নের চূড়ান্ত স্কোর মানদণ্ড পূরণ করলে শিক্ষা সম্পন্ন হয়।',
  },
  '각 강의(레슨) 단위로 수료 여부를 판단합니다.': {
    en: 'Completion is determined for each lesson.',
    th: 'การสำเร็จจะพิจารณาเป็นรายบทเรียน',
    bn: 'প্রতিটি লেসন অনুযায়ী সম্পন্নতা নির্ধারিত হয়।',
  },
  '레슨 진도율이 90% 이상이어야 학습평가(시험)에 응시할 수 있습니다.': {
    en: 'Lesson progress must be at least 90% to take the assessment.',
    th: 'ต้องมีความคืบหน้าอย่างน้อย 90% จึงจะทำแบบประเมินได้',
    bn: 'মূল্যায়ন দিতে লেসনের অগ্রগতি অন্তত ৯০% হতে হবে।',
  },
  '레슨 최종 점수는 진도 20점 + 학습평가 80점으로 계산되며, 총점 70점 이상일 경우 해당 레슨을 수료한 것으로 인정됩니다.': {
    en: 'The final lesson score is progress 20 points plus assessment 80 points; 70 or more is completed.',
    th: 'คะแนนสุดท้ายของบทเรียนคำนวณจากความคืบหน้า 20 คะแนน + แบบประเมิน 80 คะแนน และต้องได้ 70 คะแนนขึ้นไป',
    bn: 'লেসনের চূড়ান্ত স্কোর অগ্রগতি ২০ + মূল্যায়ন ৮০; মোট ৭০ বা বেশি হলে সম্পন্ন গণ্য হয়।',
  },
  '과목은 해당 과목에 포함된 모든 레슨이 수료된 경우에만 수료로 처리됩니다.': {
    en: 'A subject is completed only when all lessons in it are completed.',
    th: 'รายวิชาจะสำเร็จเมื่อบทเรียนทั้งหมดในรายวิชานั้นสำเร็จแล้วเท่านั้น',
    bn: 'বিষয়ের সব লেসন সম্পন্ন হলেই বিষয় সম্পন্ন হিসেবে গণ্য হয়।',
  },
  '교육생 유의사항': { en: 'Learner Notes', th: 'ข้อควรทราบสำหรับผู้เรียน', bn: 'শিক্ষার্থীর জন্য নির্দেশনা' },
  '모든 교육은 개인 계정 기준으로 운영되며, 계정 공유 및 대리 수강은 엄격히 금지됩니다.': {
    en: 'All training is based on individual accounts. Account sharing and proxy attendance are strictly prohibited.',
    th: 'การเรียนทั้งหมดใช้บัญชีส่วนบุคคล ห้ามแชร์บัญชีหรือเรียนแทนผู้อื่นโดยเด็ดขาด',
    bn: 'সব শিক্ষা ব্যক্তিগত অ্যাকাউন্টভিত্তিক। অ্যাকাউন্ট শেয়ার ও অন্যের হয়ে শেখা কঠোরভাবে নিষিদ্ধ।',
  },
  '수강기간 내에 진도 및 평가를 모두 완료하지 못한 경우, 미수료 처리될 수 있습니다.': {
    en: 'If progress and assessments are not completed during the period, you may be marked incomplete.',
    th: 'หากไม่เรียนและทำแบบประเมินให้ครบภายในระยะเวลา อาจถือว่ายังไม่สำเร็จ',
    bn: 'সময়কালের মধ্যে অগ্রগতি ও মূল্যায়ন শেষ না করলে অসম্পন্ন হিসেবে গণ্য হতে পারে।',
  },
  '학습 중 오류 또는 문의 사항이 있을 경우, Q&A 메뉴 또는 회사 담당자를 통해 문의해 주세요.': {
    en: 'For errors or questions during learning, use Q&A or contact your company representative.',
    th: 'หากพบข้อผิดพลาดหรือมีคำถามระหว่างเรียน โปรดใช้เมนู Q&A หรือติดต่อผู้รับผิดชอบของบริษัท',
    bn: 'শেখার সময় সমস্যা বা প্রশ্ন থাকলে Q&A মেনু ব্যবহার করুন বা কোম্পানির দায়িত্বপ্রাপ্ত ব্যক্তির সাথে যোগাযোগ করুন।',
  },
  '등록된 영상이 없습니다': { en: 'No video is registered', th: 'ยังไม่มีวิดีโอ', bn: 'কোনো ভিডিও নিবন্ধিত নেই' },
  '강사가 영상을 업로드하면 여기에 표시됩니다.': {
    en: 'The video will appear here after an instructor uploads it.',
    th: 'เมื่อผู้สอนอัปโหลดวิดีโอแล้ว จะแสดงที่นี่',
    bn: 'প্রশিক্ষক ভিডিও আপলোড করলে এখানে দেখা যাবে।',
  },
  '확인': { en: 'OK', th: 'ตกลง', bn: 'ঠিক আছে' },
  '시행일: 2025년 1월 1일': {
    en: 'Effective Date: January 1, 2025',
    th: 'วันที่มีผล: 1 มกราคม 2025',
    bn: 'কার্যকর তারিখ: ১ জানুয়ারি ২০২৫',
  },
  '한국산업안전보건기술원(주)(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.': {
    en: 'Korea Occupational Safety and Health Technology Institute Co., Ltd. (“Company”) establishes this Privacy Policy to protect users’ personal information and rights under the Personal Information Protection Act.',
    th: 'บริษัท Korea Occupational Safety and Health Technology Institute จำกัด (“บริษัท”) จัดทำนโยบายนี้เพื่อคุ้มครองข้อมูลส่วนบุคคลและสิทธิของผู้ใช้ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล',
    bn: 'Korea Occupational Safety and Health Technology Institute Co., Ltd. (“কোম্পানি”) ব্যক্তিগত তথ্য সুরক্ষা আইন অনুযায়ী ব্যবহারকারীর ব্যক্তিগত তথ্য ও অধিকার রক্ষার জন্য এই নীতি প্রণয়ন করেছে।',
  },
  '제1조 (개인정보의 처리 목적)': { en: 'Article 1. Purpose of Processing Personal Information', th: 'ข้อ 1 วัตถุประสงค์การประมวลผลข้อมูลส่วนบุคคล', bn: 'ধারা ১. ব্যক্তিগত তথ্য প্রক্রিয়াকরণের উদ্দেশ্য' },
  '제2조 (개인정보의 처리 및 보유 기간)': { en: 'Article 2. Processing and Retention Period', th: 'ข้อ 2 ระยะเวลาประมวลผลและเก็บรักษาข้อมูล', bn: 'ধারা ২. প্রক্রিয়াকরণ ও সংরক্ষণকাল' },
  '제3조 (처리하는 개인정보의 항목)': { en: 'Article 3. Personal Information Items Processed', th: 'ข้อ 3 รายการข้อมูลส่วนบุคคลที่ประมวลผล', bn: 'ধারা ৩. প্রক্রিয়াকৃত ব্যক্তিগত তথ্য' },
  '제4조 (개인정보의 제3자 제공)': { en: 'Article 4. Provision to Third Parties', th: 'ข้อ 4 การให้ข้อมูลแก่บุคคลที่สาม', bn: 'ধারা ৪. তৃতীয় পক্ষকে প্রদান' },
  '제5조 (개인정보처리의 위탁)': { en: 'Article 5. Outsourcing of Processing', th: 'ข้อ 5 การ委託ประมวลผลข้อมูล', bn: 'ধারা ৫. প্রক্রিয়াকরণ আউটসোর্সিং' },
  '제6조 (정보주체와 법정대리인의 권리·의무 및 행사방법)': { en: 'Article 6. Rights and How to Exercise Them', th: 'ข้อ 6 สิทธิและวิธีใช้สิทธิของเจ้าของข้อมูล', bn: 'ধারা ৬. অধিকার ও তা প্রয়োগের পদ্ধতি' },
  '제7조 (개인정보의 파기)': { en: 'Article 7. Destruction of Personal Information', th: 'ข้อ 7 การทำลายข้อมูลส่วนบุคคล', bn: 'ধারা ৭. ব্যক্তিগত তথ্য ধ্বংস' },
  '제8조 (개인정보의 안전성 확보조치)': { en: 'Article 8. Security Measures', th: 'ข้อ 8 มาตรการรักษาความปลอดภัย', bn: 'ধারা ৮. নিরাপত্তা ব্যবস্থা' },
  '제9조 (개인정보 보호책임자)': { en: 'Article 9. Privacy Officer', th: 'ข้อ 9 เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล', bn: 'ধারা ৯. ব্যক্তিগত তথ্য সুরক্ষা কর্মকর্তা' },
  '제10조 (개인정보 열람청구)': { en: 'Article 10. Request to Access Personal Information', th: 'ข้อ 10 การขอเข้าถึงข้อมูลส่วนบุคคล', bn: 'ধারা ১০. ব্যক্তিগত তথ্য দেখার অনুরোধ' },
  '제11조 (권익침해 구제방법)': { en: 'Article 11. Remedies for Rights Infringement', th: 'ข้อ 11 วิธีเยียวยาเมื่อสิทธิถูกละเมิด', bn: 'ধারা ১১. অধিকার লঙ্ঘনের প্রতিকার' },
  '제12조 (개인정보 처리방침 변경)': { en: 'Article 12. Changes to This Privacy Policy', th: 'ข้อ 12 การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว', bn: 'ধারা ১২. গোপনীয়তা নীতির পরিবর্তন' },
  '한국산업안전보건기술원(주)': {
    en: 'Korea Occupational Safety and Health Technology Institute Co., Ltd.',
    th: 'บริษัท Korea Occupational Safety and Health Technology Institute จำกัด',
    bn: 'Korea Occupational Safety and Health Technology Institute Co., Ltd.',
  },
  '대표자: 정의석': { en: 'Representative: Jeong Ui-seok', th: 'ผู้แทน: Jeong Ui-seok', bn: 'প্রতিনিধি: Jeong Ui-seok' },
  '주소: 경기 수원시 권선구 곡반정동 543-4 2층': {
    en: 'Address: 2F, 543-4 Gokbanjeong-dong, Gwonseon-gu, Suwon-si, Gyeonggi-do',
    th: 'ที่อยู่: ชั้น 2, 543-4 Gokbanjeong-dong, Gwonseon-gu, Suwon-si, Gyeonggi-do',
    bn: 'ঠিকানা: ২য় তলা, ৫৪৩-৪ Gokbanjeong-dong, Gwonseon-gu, Suwon-si, Gyeonggi-do',
  },
  '사업자등록번호: 790-88-00834': {
    en: 'Business Registration No.: 790-88-00834',
    th: 'เลขทะเบียนธุรกิจ: 790-88-00834',
    bn: 'ব্যবসা নিবন্ধন নম্বর: 790-88-00834',
  },
  '새 질문 작성': { en: 'New Question', th: 'เขียนคำถามใหม่', bn: 'নতুন প্রশ্ন' },
  '질문하기': { en: 'Ask Question', th: 'ถามคำถาม', bn: 'প্রশ্ন করুন' },
  '질문 등록': { en: 'Submit Question', th: 'ส่งคำถาม', bn: 'প্রশ্ন জমা দিন' },
  '아직 질문이 없습니다.': { en: 'No questions yet.', th: 'ยังไม่มีคำถาม', bn: 'এখনও কোনো প্রশ্ন নেই।' },
  '학생': { en: 'Student', th: 'ผู้เรียน', bn: 'শিক্ষার্থী' },
  '강사': { en: 'Instructor', th: 'ผู้สอน', bn: 'প্রশিক্ষক' },
  '답변': { en: 'Reply', th: 'ตอบ', bn: 'উত্তর' },
  '답변하기': { en: 'Reply', th: 'ตอบกลับ', bn: 'উত্তর দিন' },
};

export const studentAttributeTranslations: Record<string, LocaleText> = {
  '질문 제목을 입력하세요': {
    en: 'Enter a question title',
    th: 'กรอกหัวข้อคำถาม',
    bn: 'প্রশ্নের শিরোনাম লিখুন',
  },
  '질문 내용을 자세히 적어주세요': {
    en: 'Describe your question in detail',
    th: 'กรอกรายละเอียดคำถาม',
    bn: 'আপনার প্রশ্ন বিস্তারিত লিখুন',
  },
  '답변을 입력하세요': {
    en: 'Enter your reply',
    th: 'กรอกคำตอบ',
    bn: 'উত্তর লিখুন',
  },
  '이름을 입력하세요': { en: 'Enter your name', th: 'กรอกชื่อ', bn: 'আপনার নাম লিখুন' },
  '비밀번호를 입력하세요': {
    en: 'Enter your password',
    th: 'กรอกรหัสผ่าน',
    bn: 'পাসওয়ার্ড লিখুন',
  },
  '비밀번호를 다시 입력하세요': {
    en: 'Enter your password again',
    th: 'กรอกรหัสผ่านอีกครั้ง',
    bn: 'পাসওয়ার্ড আবার লিখুন',
  },
  '회사 초대코드를 입력하세요': {
    en: 'Enter your company invite code',
    th: 'กรอกรหัสเชิญบริษัท',
    bn: 'কোম্পানির আমন্ত্রণ কোড লিখুন',
  },
  '8자 이상, 대/소문자/숫자/특수문자 포함': {
    en: '8+ chars with upper/lowercase, number, and special char',
    th: '8 ตัวขึ้นไป พร้อมตัวพิมพ์ใหญ่/เล็ก ตัวเลข และอักขระพิเศษ',
    bn: '৮+ অক্ষর, বড়/ছোট অক্ষর, সংখ্যা ও বিশেষ অক্ষরসহ',
  },
  '비밀번호를 다시 입력해주세요': {
    en: 'Enter your password again',
    th: 'กรอกรหัสผ่านอีกครั้ง',
    bn: 'পাসওয়ার্ড আবার লিখুন',
  },
};

export function translateStudentText(source: string, locale: Locale): string {
  if (locale === 'ko') return source;

  const trimmed = source.trim();
  const direct = studentTextTranslations[trimmed]?.[locale];
  if (direct) {
    return source.replace(trimmed, direct);
  }

  const iconMatch = trimmed.match(/^(✅|⚠️|🔄|❌|🎊|💡|📅)\s*(.+)$/u);
  if (iconMatch) {
    const icon = iconMatch[1] ? `${iconMatch[1]} ` : '';
    const bareText = iconMatch[2] || '';
    const bareDirect = studentTextTranslations[bareText]?.[locale];
    if (bareDirect) {
      return source.replace(trimmed, `${icon}${bareDirect}`);
    }

    const bareDynamic = translateDynamicStudentText(bareText, locale);
    if (bareDynamic) {
      return source.replace(trimmed, `${icon}${bareDynamic}`);
    }
  }

  const dynamic = translateDynamicStudentText(trimmed, locale);
  return dynamic ? source.replace(trimmed, dynamic) : source;
}

export function translateStudentAttribute(source: string, locale: Locale): string {
  if (locale === 'ko') return source;
  return studentAttributeTranslations[source]?.[locale] || translateStudentText(source, locale);
}

function translateDynamicStudentText(text: string, locale: Locale): string | null {
  const lessonCount = text.match(/^총 (\d+)개 강의$/);
  if (lessonCount) {
    return pick(locale, `Total ${lessonCount[1]} lessons`, `ทั้งหมด ${lessonCount[1]} บทเรียน`, `মোট ${lessonCount[1]}টি লেসন`);
  }

  const points = text.match(/^(\d+)점$/);
  if (points) {
    return pick(locale, `${points[1]} pts`, `${points[1]} คะแนน`, `${points[1]} পয়েন্ট`);
  }

  const attempts = text.match(/^(\d+)회$/);
  if (attempts) {
    return pick(locale, `${attempts[1]} times`, `${attempts[1]} ครั้ง`, `${attempts[1]} বার`);
  }

  const attemptRound = text.match(/^(\d+)회차$/);
  if (attemptRound) {
    return pick(locale, `Attempt ${attemptRound[1]}`, `ครั้งที่ ${attemptRound[1]}`, `চেষ্টা ${attemptRound[1]}`);
  }

  const questions = text.match(/^(\d+)문제$/);
  if (questions) {
    return pick(locale, `${questions[1]} questions`, `${questions[1]} ข้อ`, `${questions[1]}টি প্রশ্ন`);
  }

  const questionItems = text.match(/^(\d+)문항$/);
  if (questionItems) {
    return pick(locale, `${questionItems[1]} questions`, `${questionItems[1]} ข้อ`, `${questionItems[1]}টি প্রশ্ন`);
  }

  const progress = text.match(/^진도율 (\d+)%$/);
  if (progress) {
    return pick(locale, `Progress ${progress[1]}%`, `ความคืบหน้า ${progress[1]}%`, `অগ্রগতি ${progress[1]}%`);
  }

  const lesson = text.match(/^레슨 (.+)$/);
  if (lesson) {
    return pick(locale, `Lesson ${lesson[1]}`, `บทเรียน ${lesson[1]}`, `লেসন ${lesson[1]}`);
  }

  const examTitle = text.match(/^(.+) 시험$/);
  if (examTitle) {
    return pick(locale, `${examTitle[1]} Exam`, `แบบทดสอบ ${examTitle[1]}`, `${examTitle[1]} পরীক্ষা`);
  }

  const examTry = text.match(/^시험 보기 \((\d+)\/3회 남음\)$/);
  if (examTry) {
    return pick(locale, `Take Exam (${examTry[1]}/3 left)`, `ทำแบบทดสอบ (เหลือ ${examTry[1]}/3)`, `পরীক্ষা দিন (${examTry[1]}/৩ বাকি)`);
  }

  const questionProgress = text.match(/^(\d+) \/ (\d+) 문항$/);
  if (questionProgress) {
    return pick(locale, `${questionProgress[1]} / ${questionProgress[2]} questions`, `${questionProgress[1]} / ${questionProgress[2]} ข้อ`, `${questionProgress[1]} / ${questionProgress[2]} প্রশ্ন`);
  }

  const answered = text.match(/^(\d+)\/(\d+) 문항 완료$/);
  if (answered) {
    return pick(locale, `${answered[1]}/${answered[2]} answered`, `ตอบแล้ว ${answered[1]}/${answered[2]} ข้อ`, `${answered[1]}/${answered[2]} উত্তর দেওয়া হয়েছে`);
  }

  const resendSeconds = text.match(/^인증번호 재전송 \((\d+)초\)$/);
  if (resendSeconds) {
    return pick(locale, `Resend Code (${resendSeconds[1]}s)`, `ส่งรหัสอีกครั้ง (${resendSeconds[1]} วิ)`, `কোড আবার পাঠান (${resendSeconds[1]} সেকেন্ড)`);
  }

  const resendCountdown = text.match(/^인증번호 재전송 가능시간: (\d+)초$/);
  if (resendCountdown) {
    return pick(locale, `You can resend the code in ${resendCountdown[1]}s`, `ส่งรหัสใหม่ได้ใน ${resendCountdown[1]} วินาที`, `${resendCountdown[1]} সেকেন্ড পরে কোড আবার পাঠানো যাবে`);
  }

  const remainingAttempts = text.match(/^남은 시험 기회: (\d+)회$/);
  if (remainingAttempts) {
    return pick(locale, `Exam attempts left: ${remainingAttempts[1]}`, `โอกาสสอบที่เหลือ: ${remainingAttempts[1]} ครั้ง`, `বাকি পরীক্ষার সুযোগ: ${remainingAttempts[1]} বার`);
  }

  const unanswered = text.match(/^(\d+)개 문제가 답변되지 않았습니다\. 제출하시겠습니까\?$/);
  if (unanswered) {
    return pick(locale, `${unanswered[1]} questions are unanswered. Submit anyway?`, `ยังไม่ได้ตอบ ${unanswered[1]} ข้อ ต้องการส่งหรือไม่?`, `${unanswered[1]}টি প্রশ্নের উত্তর দেওয়া হয়নি। জমা দেবেন?`);
  }

  const watched = text.match(/^\((\d+)% 수강\)$/);
  if (watched) {
    return pick(locale, `(${watched[1]}% watched)`, `(เรียนแล้ว ${watched[1]}%)`, `(${watched[1]}% দেখা হয়েছে)`);
  }

  const examScore = text.match(/^\(시험 (\d+)점\)$/);
  if (examScore) {
    return pick(locale, `(Exam ${examScore[1]} pts)`, `(สอบ ${examScore[1]} คะแนน)`, `(পরীক্ষা ${examScore[1]} পয়েন্ট)`);
  }

  const nextAttempt = text.match(/^남은 (\d+)회의 기회로 재응시하세요$/);
  if (nextAttempt) {
    return pick(locale, `Retake the exam with your ${nextAttempt[1]} remaining attempts.`, `สอบใหม่ด้วยโอกาสที่เหลือ ${nextAttempt[1]} ครั้ง`, `বাকি ${nextAttempt[1]}টি সুযোগ দিয়ে আবার পরীক্ষা দিন।`);
  }

  return null;
}

function pick(locale: Locale, en: string, th: string, bn: string) {
  if (locale === 'th') return th;
  if (locale === 'bn') return bn;
  return en;
}
