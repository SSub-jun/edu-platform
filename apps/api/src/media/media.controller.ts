import { 
  Controller, 
  Post, 
  Get,
  Delete,
  UseInterceptors, 
  UploadedFile, 
  Body,
  Param,
  Res,
  StreamableFile,
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private prisma: PrismaService) {}

  @Post('videos/upload')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '영상 파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        lessonId: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        order: {
          type: 'number',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // 모든 비디오를 하나의 폴더에 저장
          const uploadPath = join(process.cwd(), 'uploads', 'videos');
          
          // 폴더가 없으면 생성
          const fs = require('fs');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          cb(null, `video-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // 영상 파일만 허용
        const allowedMimes = [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime', // .mov
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('영상 파일만 업로드 가능합니다. (mp4, webm, ogg, mov)'), false);
        }
      },
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB 제한
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { lessonId: string; title: string; description?: string; order?: number },
  ) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    // 영상의 실제 길이를 가져오기 위해서는 ffprobe 같은 도구가 필요하지만,
    // 여기서는 간단히 0으로 설정하고 프론트엔드에서 전달받거나 나중에 처리
    const durationMs = 0; // TODO: ffprobe로 실제 길이 측정

    // DB에 VideoPart 생성
    const videoPart = await this.prisma.videoPart.create({
      data: {
        lessonId: body.lessonId,
        title: body.title,
        description: body.description,
        order: body.order ? parseInt(body.order.toString()) : 0,
        durationMs,
        videoUrl: `/uploads/videos/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        isActive: true,
      },
    });

    return {
      success: true,
      data: {
        id: videoPart.id,
        title: videoPart.title,
        videoUrl: videoPart.videoUrl,
        fileSize: videoPart.fileSize,
        mimeType: videoPart.mimeType,
      },
    };
  }

  @Get('videos/:filename')
  @ApiOperation({ summary: '영상 파일 스트리밍' })
  async streamVideo(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filePath = join(process.cwd(), 'uploads', 'videos', filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('파일을 찾을 수 없습니다.');
    }

    const file = createReadStream(filePath);
    
    // MIME 타입 설정
    const ext = extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
    };
    
    res.set({
      'Content-Type': mimeTypes[ext] || 'video/mp4',
      'Accept-Ranges': 'bytes',
    });

    return new StreamableFile(file);
  }

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

    // 실제 파일 삭제
    if (videoPart.videoUrl) {
      const filePath = join(process.cwd(), videoPart.videoUrl);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
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