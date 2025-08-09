import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  @Get('play-token')
  @ApiOperation({ summary: '미디어 재생 토큰 발급' })
  @ApiQuery({ name: 'lessonId', required: true, description: '레슨 ID' })
  @ApiQuery({ name: 'partId', required: false, description: '파트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '재생 토큰 발급 성공',
    schema: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string', example: 'https://example.invalid/...' },
        ttlSec: { type: 'number', example: 300 }
      }
    }
  })
  getPlayToken(
    @Query('lessonId') lessonId: string,
    @Query('partId') partId?: string
  ) {
    return {
      signedUrl: `https://example.invalid/lesson/${lessonId}${partId ? `/part/${partId}` : ''}?token=mock-token`,
      ttlSec: 300
    };
  }
}
