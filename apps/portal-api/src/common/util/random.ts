/**
 * 세션 코드 생성 (대문자 + 숫자)
 */
export function generateSessionCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Fisher-Yates 셔플 알고리즘
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 배열에서 랜덤하게 n개 선택
 */
export function randomSample<T>(array: T[], count: number): T[] {
  if (count >= array.length) {
    return shuffleArray(array);
  }
  
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}





