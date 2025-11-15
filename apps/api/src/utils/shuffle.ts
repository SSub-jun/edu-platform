/**
 * Fisher-Yates 셔플 알고리즘
 * 배열을 무작위로 섞는 안정적인 구현
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]; // 원본 배열 보존
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * 배열에서 무작위로 n개 선택
 */
export function selectRandom<T>(array: T[], count: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
}











