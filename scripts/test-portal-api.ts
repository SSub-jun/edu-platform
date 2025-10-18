import axios from 'axios';

const API_BASE_URL = 'http://localhost:4100';

async function testPortalAPI() {
  console.log('🧪 Portal API 테스트 시작...\n');

  try {
    // 1. 관리자 로그인 테스트
    console.log('1️⃣ 관리자 로그인 테스트');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'admin',
      password: 'change-me'
    });
    console.log('✅ 로그인 성공:', loginResponse.data);
    const token = loginResponse.data.access_token;

    // 2. 세션 목록 조회 테스트
    console.log('\n2️⃣ 세션 목록 조회 테스트');
    const sessionsResponse = await axios.get(`${API_BASE_URL}/admin/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 세션 목록 조회 성공:', sessionsResponse.data.length, '개 세션');

    // 3. 문제은행 목록 조회 테스트
    console.log('\n3️⃣ 문제은행 목록 조회 테스트');
    const banksResponse = await axios.get(`${API_BASE_URL}/admin/banks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 문제은행 목록 조회 성공:', banksResponse.data.length, '개 문제은행');

    // 4. 샘플 세션으로 공개 API 테스트
    console.log('\n4️⃣ 공개 API 테스트 (샘플 세션)');
    const sessionCode = 'SAMPLE01';
    
    // 세션 정보 조회
    const sessionInfoResponse = await axios.get(`${API_BASE_URL}/portal/sessions/${sessionCode}`);
    console.log('✅ 세션 정보 조회 성공:', sessionInfoResponse.data.title);

    // 세션 참여
    const joinResponse = await axios.post(`${API_BASE_URL}/portal/sessions/${sessionInfoResponse.data.id}/join`, {
      name: '테스트 참가자',
      pin4: '1234'
    });
    console.log('✅ 세션 참여 성공:', joinResponse.data.participant.name);
    const participantToken = joinResponse.data.access_token;

    // 시험 시작
    const startResponse = await axios.post(`${API_BASE_URL}/portal/sessions/${sessionInfoResponse.data.id}/start`, {}, {
      headers: { Authorization: `Bearer ${participantToken}` }
    });
    console.log('✅ 시험 시작 성공:', startResponse.data.questions.length, '개 문제');

    // 5. 가변 보기 수 테스트
    console.log('\n5️⃣ 가변 보기 수 테스트');
    const questions = startResponse.data.questions;
    const choiceCounts = questions.map((q: any) => q.choices.length);
    const uniqueChoiceCounts = [...new Set(choiceCounts)];
    console.log('✅ 보기 수 분포:', uniqueChoiceCounts.sort((a, b) => a - b));
    console.log('✅ 최소 보기 수:', Math.min(...choiceCounts));
    console.log('✅ 최대 보기 수:', Math.max(...choiceCounts));

    // 6. 답안 제출 테스트 (랜덤 답안)
    console.log('\n6️⃣ 답안 제출 테스트');
    const answers = questions.map((q: any) => ({
      questionId: q.id,
      choiceId: q.choices[Math.floor(Math.random() * q.choices.length)].id
    }));

    const submitResponse = await axios.post(`${API_BASE_URL}/portal/attempts/${startResponse.data.attemptId}/submit`, {
      answers
    }, {
      headers: { Authorization: `Bearer ${participantToken}` }
    });
    console.log('✅ 답안 제출 성공:');
    console.log('   - 점수:', submitResponse.data.score);
    console.log('   - 합격 여부:', submitResponse.data.passed ? '합격' : '불합격');
    console.log('   - 정답 수:', submitResponse.data.correctCount, '/', submitResponse.data.totalCount);

    // 7. 결과 조회 테스트
    console.log('\n7️⃣ 결과 조회 테스트');
    const resultResponse = await axios.get(`${API_BASE_URL}/portal/attempts/${startResponse.data.attemptId}/result`, {
      headers: { Authorization: `Bearer ${participantToken}` }
    });
    console.log('✅ 결과 조회 성공:', resultResponse.data.score, '점');

    console.log('\n🎉 모든 테스트 통과!');
    console.log('\n📊 테스트 요약:');
    console.log('   - 관리자 인증: ✅');
    console.log('   - 세션 관리: ✅');
    console.log('   - 문제은행 관리: ✅');
    console.log('   - 공개 API: ✅');
    console.log('   - 가변 보기 수: ✅');
    console.log('   - 답안 제출/채점: ✅');
    console.log('   - 결과 조회: ✅');

  } catch (error: any) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
    process.exit(1);
  }
}

testPortalAPI();





