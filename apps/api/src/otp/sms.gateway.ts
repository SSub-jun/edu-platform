import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsMessage {
  phone: string;
  message: string;
}

@Injectable()
export class SmsGateway {
  private readonly logger = new Logger(SmsGateway.name);

  constructor(private readonly config: ConfigService) {}

  async sendSms(message: SmsMessage): Promise<void> {
    const provider = this.config.get<string>('SMS_PROVIDER', 'mock');

    switch (provider) {
      case 'mock':
        await this.sendMockSms(message);
        break;
      case 'solapi':
        await this.sendSolapiSms(message);
        break;
      default:
        this.logger.warn(`SMS Provider '${provider}' is not implemented yet`);
        throw new Error(`SMS Provider '${provider}' is not supported`);
    }
  }

  private async sendMockSms(message: SmsMessage): Promise<void> {
    const senderId = this.config.get<string>('SMS_SENDER_ID', 'EDU-PLATFORM');
    
    // 개발환경에서는 콘솔에 OTP 출력
    this.logger.log(`[MOCK SMS] To: ${message.phone}, From: ${senderId}`);
    this.logger.log(`[MOCK SMS] Message: ${message.message}`);
    
    // Mock 딜레이 (실제 SMS 발송과 유사한 경험 제공)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * SOLAPI를 이용한 SMS 발송
   */
  private async sendSolapiSms(message: SmsMessage): Promise<void> {
    try {
      // SOLAPI SDK 동적 import
      const { SolapiMessageService } = await import('solapi');
      
      const apiKey = this.config.get<string>('SOLAPI_API_KEY');
      const apiSecret = this.config.get<string>('SOLAPI_API_SECRET');
      const fromNumber = this.config.get<string>('SMS_SENDER_ID');

      if (!apiKey || !apiSecret || !fromNumber) {
        throw new Error('SOLAPI credentials are not configured. Please set SOLAPI_API_KEY, SOLAPI_API_SECRET, and SMS_SENDER_ID environment variables.');
      }

      const messageService = new SolapiMessageService(apiKey, apiSecret);

      // 한국 전화번호 형식 정규화
      const normalizedPhone = this.normalizeKoreanPhoneNumber(message.phone);
      const normalizedFrom = this.normalizeKoreanPhoneNumber(fromNumber);

      const result = await messageService.send([{
        to: normalizedPhone,
        from: normalizedFrom,
        text: message.message,
      }], { showMessageList: true });

      // SOLAPI 응답 확인
      if (result.messageList && result.messageList.length > 0) {
        const messageResult = result.messageList[0];
        if (messageResult.statusCode === '2000') {
          this.logger.log(`[SOLAPI] SMS sent successfully to ${normalizedPhone}. MessageId: ${messageResult.messageId}`);
        } else {
          throw new Error(`SOLAPI API error - Status: ${messageResult.statusCode}, Message: ${messageResult.statusMessage}`);
        }
      } else if (result.failedMessageList && result.failedMessageList.length > 0) {
        throw new Error(`SOLAPI API error - All messages failed: ${JSON.stringify(result.failedMessageList)}`);
      } else {
        // 그룹 상태 확인
        this.logger.log(`[SOLAPI] SMS group created successfully. GroupId: ${result.groupInfo.groupId}, Status: ${result.groupInfo.status}`);
      }

    } catch (error) {
      this.logger.error(`[SOLAPI] Failed to send SMS to ${message.phone}: ${error.message}`);
      
      // 프로덕션에서는 실패해도 사용자에게 성공으로 보이게 함 (보안상 이유)
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn('[SOLAPI] SMS sending failed in production, but returning success to prevent user enumeration');
        return;
      }
      
      throw error;
    }
  }

  /**
   * 한국 전화번호를 SOLAPI 형식으로 정규화
   * 예: 010-1234-5678 -> 82101234567
   */
  private normalizeKoreanPhoneNumber(phone: string): string {
    // 숫자만 추출
    const digits = phone.replace(/\D/g, '');
    
    // 한국 번호 형식 검증 및 변환 (SOLAPI는 하이픈 형식 요구)
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

  createOtpMessage(code: string): string {
    return `[교육플랫폼] 인증번호: ${code} (5분 내 입력)`;
  }
}







