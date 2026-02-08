import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { Roles } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

// ── DTOs ──

class RequestUploadDto {
  @ApiProperty({ description: '레슨 ID' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ description: '영상 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '영상 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '정렬 순서', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: '파일 이름 (예: lecture-01.mp4)' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'MIME 타입 (예: video/mp4)' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: '파일 크기 (bytes)' })
  @IsNumber()
  fileSize: number;
}

class ConfirmUploadDto {
  @ApiProperty({ description: '업로드 요청 시 받은 videoPartId' })
  @IsString()
  @IsNotEmpty()
  videoPartId: string;
}

// ── Controller ──

const ALLOWED_MIMES = [
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  // ────────────────────────────────────────
  // 1) 업로드 URL 발급 (Signed Upload URL)
  // ────────────────────────────────────────

  @Post('videos/request-upload')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '영상 업로드 URL 발급',
    description:
      'Supabase Storage에 직접 업로드할 수 있는 signed URL을 발급합니다. 프론트엔드는 이 URL로 파일을 PUT 요청합니다.',
  })
  async requestUpload(@Body() dto: RequestUploadDto) {
    // 검증: MIME 타입
    if (!ALLOWED_MIMES.includes(dto.mimeType)) {
      throw new BadRequestException(
        '영상 파일만 업로드 가능합니다. (mp4, webm, ogg, mov)',
      );
    }

    // 검증: 파일 크기
    if (dto.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(
        '파일 크기는 1GB를 초과할 수 없습니다.',
      );
    }

    // 검증: 레슨 존재 여부
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
    });
    if (!lesson) {
      throw new BadRequestException('레슨을 찾을 수 없습니다.');
    }

    // 스토리지 경로 생성
    const sanitizedFilename = dto.filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .toLowerCase();
    const timestamp = Date.now();
    const storagePath = `${dto.lessonId}/${timestamp}-${sanitizedFilename}`;

    // Supabase signed upload URL 발급
    let signedUploadData: { signedUrl: string; token: string };
    try {
      signedUploadData = await this.supabase.createSignedUploadUrl(storagePath);
    } catch (error) {
      throw new InternalServerErrorException(
        `업로드 URL 발급에 실패했습니다: ${error.message}`,
      );
    }

    // DB에 VideoPart 생성 (아직 비활성 상태)
    const videoPart = await this.prisma.videoPart.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        description: dto.description,
        order: dto.order ?? 0,
        durationMs: 0,
        videoUrl: storagePath, // Supabase 스토리지 경로 저장
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        isActive: false, // 업로드 완료 전까지 비활성
      },
    });

    return {
      success: true,
      data: {
        videoPartId: videoPart.id,
        signedUrl: signedUploadData.signedUrl,
        token: signedUploadData.token,
        storagePath,
      },
    };
  }

  // ────────────────────────────────────────
  // 2) 업로드 완료 확인
  // ────────────────────────────────────────

  @Post('videos/confirm-upload')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '영상 업로드 완료 확인',
    description:
      'Supabase Storage 업로드 완료 후 호출합니다. VideoPart를 활성화합니다.',
  })
  async confirmUpload(@Body() dto: ConfirmUploadDto) {
    const videoPart = await this.prisma.videoPart.findUnique({
      where: { id: dto.videoPartId },
    });

    if (!videoPart) {
      throw new BadRequestException('영상 정보를 찾을 수 없습니다.');
    }

    if (videoPart.isActive) {
      return {
        success: true,
        message: '이미 활성화된 영상입니다.',
      };
    }

    // 활성화
    await this.prisma.videoPart.update({
      where: { id: dto.videoPartId },
      data: { isActive: true },
    });

    return {
      success: true,
      message: '영상 업로드가 완료되었습니다.',
    };
  }

  // ────────────────────────────────────────
  // 3) 재생용 Signed URL 발급
  // ────────────────────────────────────────

  @Get('videos/:videoPartId/signed-url')
  @ApiOperation({
    summary: '영상 재생 URL 발급',
    description:
      '영상 재생을 위한 signed URL을 발급합니다. 2시간 동안 유효합니다.',
  })
  async getSignedUrl(@Param('videoPartId') videoPartId: string) {
    const videoPart = await this.prisma.videoPart.findUnique({
      where: { id: videoPartId },
    });

    if (!videoPart) {
      throw new BadRequestException('영상을 찾을 수 없습니다.');
    }

    const videoUrl = videoPart.videoUrl;

    if (!videoUrl) {
      throw new BadRequestException('영상 URL이 없습니다.');
    }

    // 이미 절대 URL인 경우 (Supabase 대시보드에서 직접 입력한 URL)
    if (videoUrl.startsWith('http')) {
      return {
        success: true,
        data: {
          signedUrl: videoUrl,
          expiresIn: null, // 만료 없음
        },
      };
    }

    // Supabase 스토리지 경로인 경우 → signed URL 발급
    try {
      const signedUrlData = await this.supabase.createSignedUrl(videoUrl, 7200);
      return {
        success: true,
        data: {
          signedUrl: signedUrlData.signedUrl,
          expiresIn: 7200,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `재생 URL 발급에 실패했습니다: ${error.message}`,
      );
    }
  }

  // ────────────────────────────────────────
  // 4) 영상 삭제
  // ────────────────────────────────────────

  @Delete('videos/:id')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '영상 파일 삭제' })
  async deleteVideo(@Param('id') videoPartId: string) {
    const videoPart = await this.prisma.videoPart.findUnique({
      where: { id: videoPartId },
    });

    if (!videoPart) {
      throw new BadRequestException('영상을 찾을 수 없습니다.');
    }

    // Supabase Storage에서 파일 삭제
    if (videoPart.videoUrl && !videoPart.videoUrl.startsWith('http')) {
      try {
        await this.supabase.removeFile(videoPart.videoUrl);
      } catch (error) {
        console.warn(
          `[MEDIA] Supabase 파일 삭제 실패 (계속 진행): ${error.message}`,
        );
      }
    }

    // DB에서 삭제
    await this.prisma.videoPart.delete({
      where: { id: videoPartId },
    });

    return {
      success: true,
      message: '영상이 삭제되었습니다.',
    };
  }

  // ────────────────────────────────────────
  // 5) 특정 레슨의 영상 목록 조회
  // ────────────────────────────────────────

  @Get('lessons/:lessonId/videos')
  @ApiOperation({ summary: '특정 레슨의 영상 목록 조회' })
  async getVideosByLesson(@Param('lessonId') lessonId: string) {
    const videoParts = await this.prisma.videoPart.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      data: videoParts,
    };
  }
}
