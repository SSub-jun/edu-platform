/**
 * SOLAPI SMS 발송 유틸리티 함수
 * Next.js Route Handler 예시 포함
 */

import { SolapiMessageService } from 'solapi';

export interface SendSMSParams {
  to: string;
  message: string;
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: string;
}

/**
 * SOLAPI를 이용한 단건 SMS 발송 함수
 */
export async function sendSMS({ to, message }: SendSMSParams): Promise<SendSMSResponse> {
  try {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const fromNumber = process.env.SMS_SENDER_ID;

    if (!apiKey || !apiSecret || !fromNumber) {
      throw new Error('SOLAPI credentials are not configured. Please set SOLAPI_API_KEY, SOLAPI_API_SECRET, and SMS_SENDER_ID environment variables.');
    }

    const messageService = new SolapiMessageService(apiKey, apiSecret);

    // 한국 전화번호 형식 정규화
    const normalizedTo = normalizeKoreanPhoneNumber(to);
    const normalizedFrom = normalizeKoreanPhoneNumber(fromNumber);

    console.log(`[SOLAPI] Sending SMS to ${normalizedTo} from ${normalizedFrom}`);
    console.log(`[SOLAPI] Message: ${message}`);

    const result = await messageService.send([{
      to: normalizedTo,
      from: normalizedFrom,
      text: message,
    }], { showMessageList: true });

    // SOLAPI 응답 확인 (성공 코드: 2000)
    if (result.messageList && result.messageList.length > 0) {
      const messageResult = result.messageList[0];
      if (messageResult.statusCode === '2000') {
        console.log(`[SOLAPI] SMS sent successfully. MessageId: ${messageResult.messageId}`);
        return {
          success: true,
          messageId: messageResult.messageId,
          statusCode: messageResult.statusCode,
        };
      } else {
        console.error(`[SOLAPI] API error - Status: ${messageResult.statusCode}, Message: ${messageResult.statusMessage}`);
        return {
          success: false,
          error: `SOLAPI API error - Status: ${messageResult.statusCode}, Message: ${messageResult.statusMessage}`,
          statusCode: messageResult.statusCode,
        };
      }
    } else if (result.failedMessageList && result.failedMessageList.length > 0) {
      console.error(`[SOLAPI] All messages failed: ${JSON.stringify(result.failedMessageList)}`);
      return {
        success: false,
        error: `SOLAPI API error - All messages failed: ${JSON.stringify(result.failedMessageList)}`,
      };
    } else {
      // 그룹 생성만 성공한 경우 (메시지 발송은 비동기 처리)
      console.log(`[SOLAPI] SMS group created successfully. GroupId: ${result.groupInfo.groupId}`);
      return {
        success: true,
        messageId: result.groupInfo.groupId,
        statusCode: 'GROUP_CREATED',
      };
    }

  } catch (error) {
    console.error(`[SOLAPI] Failed to send SMS: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 한국 전화번호를 SOLAPI 형식으로 정규화
 * 예: 010-1234-5678 -> 82101234567
 */
function normalizeKoreanPhoneNumber(phone: string): string {
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  
  // 한국 번호 형식 검증 및 변환
  if (digits.startsWith('010') && digits.length === 11) {
    // 010-XXXX-XXXX 형식으로 변환
    return `${digits.substring(0, 3)}-${digits.substring(3, 7)}-${digits.substring(7)}`;
  } else if (digits.startsWith('82') && digits.length === 12) {
    // 82로 시작하는 경우 010으로 변환 후 하이픈 추가
    return `010-${digits.substring(3, 7)}-${digits.substring(7)}`;
  } else if (digits.length === 11) {
    // 기타 11자리 번호 (010 외)
    return `${digits.substring(0, 3)}-${digits.substring(3, 7)}-${digits.substring(7)}`;
  }
  
  // 기본적으로 입력된 형식 그대로 반환
  return phone;
}

/**
 * Next.js Route Handler 예시
 * 파일 위치: app/api/send-sms/route.ts
 */
export const nextjsRouteHandlerExample = `
import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/utils/solapi-sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;

    // 입력값 검증
    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const phoneRegex = /^(01[016789]{1}|02|0[3-9]{1}[0-9]{1})-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // SMS 발송
    const result = await sendSMS({ to, message });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully'
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('SMS API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 사용 예시:
// POST /api/send-sms
// {
//   "to": "01012345678",
//   "message": "[교육플랫폼] 인증번호: 123456 (5분 내 입력)"
// }
`;
