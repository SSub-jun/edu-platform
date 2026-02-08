import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.client = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'videos';
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }

  /**
   * 프론트엔드가 직접 Supabase에 업로드할 수 있도록 signed upload URL 발급
   */
  async createSignedUploadUrl(path: string): Promise<{ signedUrl: string; token: string; path: string }> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Signed upload URL 생성 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 영상 재생용 signed URL 발급 (기본 2시간)
   */
  async createSignedUrl(path: string, expiresIn = 7200): Promise<{ signedUrl: string }> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Signed URL 생성 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * Supabase Storage에서 파일 삭제
   */
  async removeFile(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`파일 삭제 실패: ${error.message}`);
    }
  }
}
