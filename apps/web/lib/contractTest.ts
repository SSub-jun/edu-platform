// API 응답 스키마 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 시험 관련 스키마
export interface ExamQuestion {
  id: string;
  stem: string;
  choices: string[];
}

export interface ExamAttempt {
  id: string;
  subjectId: string;
  cycle: number;
  tryIndex: number;
  status: 'inProgress' | 'submitted';
  questions: ExamQuestion[];
  startedAt: string;
}

export interface ExamResult {
  attemptId: string;
  score: number;
  progressPercent: number;
  finalScore: number;
  passed: boolean;
  submittedAt: string;
  status: string;
}

// 진도 관련 스키마
export interface ProgressInfo {
  lock: boolean;
  blockedBy?: {
    lessonId: string;
    lessonTitle: string;
    order: number;
  };
  nextAvailable?: {
    subjectId: string;
    lessonId: string;
    lessonTitle: string;
  };
}

// 스키마 검증 함수
export function validateExamAttempt(data: any): data is ExamAttempt {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.subjectId === 'string' &&
    typeof data.cycle === 'number' &&
    typeof data.tryIndex === 'number' &&
    ['inProgress', 'submitted'].includes(data.status) &&
    Array.isArray(data.questions) &&
    data.questions.every((q: any) => 
      typeof q.id === 'string' &&
      typeof q.stem === 'string' &&
      Array.isArray(q.choices) &&
      q.choices.every((c: any) => typeof c === 'string')
    ) &&
    typeof data.startedAt === 'string'
  );
}

export function validateExamResult(data: any): data is ExamResult {
  return (
    typeof data === 'object' &&
    typeof data.attemptId === 'string' &&
    typeof data.score === 'number' &&
    typeof data.progressPercent === 'number' &&
    typeof data.finalScore === 'number' &&
    typeof data.passed === 'boolean' &&
    typeof data.submittedAt === 'string' &&
    typeof data.status === 'string'
  );
}

export function validateProgressInfo(data: any): data is ProgressInfo {
  return (
    typeof data === 'object' &&
    typeof data.lock === 'boolean' &&
    (data.blockedBy === undefined || (
      typeof data.blockedBy === 'object' &&
      typeof data.blockedBy.lessonId === 'string' &&
      typeof data.blockedBy.lessonTitle === 'string' &&
      typeof data.blockedBy.order === 'number'
    )) &&
    (data.nextAvailable === undefined || (
      typeof data.nextAvailable === 'object' &&
      typeof data.nextAvailable.subjectId === 'string' &&
      typeof data.nextAvailable.lessonId === 'string' &&
      typeof data.nextAvailable.lessonTitle === 'string'
    ))
  );
}

// 에러 응답 스키마
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export function validateErrorResponse(data: any): data is ErrorResponse {
  return (
    typeof data === 'object' &&
    typeof data.statusCode === 'number' &&
    typeof data.message === 'string'
  );
}

// 스냅샷 비교 함수
export function compareSnapshots<T>(current: T, expected: T, path: string = ''): string[] {
  const errors: string[] = [];

  if (typeof current !== typeof expected) {
    errors.push(`${path}: 타입 불일치 - 현재: ${typeof current}, 예상: ${typeof expected}`);
    return errors;
  }

  if (typeof current !== 'object' || current === null) {
    if (current !== expected) {
      errors.push(`${path}: 값 불일치 - 현재: ${current}, 예상: ${expected}`);
    }
    return errors;
  }

  if (Array.isArray(current) !== Array.isArray(expected)) {
    errors.push(`${path}: 배열 타입 불일치`);
    return errors;
  }

  if (Array.isArray(current)) {
    if (current.length !== (expected as any[]).length) {
      errors.push(`${path}: 배열 길이 불일치 - 현재: ${current.length}, 예상: ${(expected as any[]).length}`);
    }
    
    const maxLength = Math.max(current.length, (expected as any[]).length);
    for (let i = 0; i < maxLength; i++) {
      const currentErrors = compareSnapshots(
        current[i], 
        (expected as any[])[i], 
        `${path}[${i}]`
      );
      errors.push(...currentErrors);
    }
  } else {
    const currentKeys = Object.keys(current);
    const expectedKeys = Object.keys(expected as object);
    
    const allKeys = new Set([...currentKeys, ...expectedKeys]);
    
    for (const key of allKeys) {
      const currentValue = (current as any)[key];
      const expectedValue = (expected as any)[key];
      
      if (!currentKeys.includes(key)) {
        errors.push(`${path}.${key}: 누락된 필드`);
      } else if (!expectedKeys.includes(key)) {
        errors.push(`${path}.${key}: 예상치 못한 필드`);
      } else {
        const fieldErrors = compareSnapshots(
          currentValue, 
          expectedValue, 
          `${path}.${key}`
        );
        errors.push(...fieldErrors);
      }
    }
  }

  return errors;
}

// API 응답 검증 함수
export function validateApiResponse<T>(
  response: any, 
  validator: (data: any) => data is T,
  expectedFields?: (keyof T)[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 기본 응답 구조 검증
  if (typeof response !== 'object' || response === null) {
    return { isValid: false, errors: ['응답이 객체가 아닙니다.'] };
  }

  // 필수 필드 검증
  if (expectedFields) {
    for (const field of expectedFields) {
      if (!(field in response)) {
        errors.push(`필수 필드 누락: ${String(field)}`);
      }
    }
  }

  // 타입 검증
  if (!validator(response)) {
    errors.push('응답 데이터 타입이 올바르지 않습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 스냅샷 테스트 헬퍼
export class SnapshotTester {
  private snapshots: Map<string, any> = new Map();

  // 스냅샷 저장
  saveSnapshot(name: string, data: any): void {
    this.snapshots.set(name, JSON.parse(JSON.stringify(data)));
  }

  // 스냅샷 비교
  compareSnapshot(name: string, currentData: any): { matches: boolean; errors: string[] } {
    const expectedData = this.snapshots.get(name);
    
    if (!expectedData) {
      return { 
        matches: false, 
        errors: [`스냅샷 '${name}'이 존재하지 않습니다.`] 
      };
    }

    const errors = compareSnapshots(currentData, expectedData, name);
    return {
      matches: errors.length === 0,
      errors
    };
  }

  // 스냅샷 업데이트
  updateSnapshot(name: string, data: any): void {
    this.saveSnapshot(name, data);
  }

  // 모든 스냅샷 가져오기
  getAllSnapshots(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, data] of this.snapshots) {
      result[name] = data;
    }
    return result;
  }
}

// 전역 스냅샷 테스터 인스턴스
export const snapshotTester = new SnapshotTester();
