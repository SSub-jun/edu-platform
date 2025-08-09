import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { DevAuthGuard } from '../guards/dev-auth.guard';

class QnaPostDto {
  subjectId: string;
  lessonId?: string;
  title: string;
  body: string;
}

class QnaReplyDto {
  postId: string;
  body: string;
}

@ApiTags('QnA')
@Controller('qna')
export class QnaController {
  @Post('posts')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: 'Q&A 게시글 작성' })
  @ApiBody({ type: QnaPostDto })
  @ApiResponse({ 
    status: 200, 
    description: '게시글 작성 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'post-1' },
        subjectId: { type: 'string', example: 'subject-1' },
        lessonId: { type: 'string', example: 'lesson-1' },
        title: { type: 'string', example: '질문 제목' },
        body: { type: 'string', example: '질문 내용' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: '인증 토큰이 없거나 유효하지 않음' })
  createPost(@Body() body: QnaPostDto) {
    return {
      id: 'post-1',
      ...body
    };
  }

  @Post('replies')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: 'Q&A 답변 작성' })
  @ApiBody({ type: QnaReplyDto })
  @ApiResponse({ 
    status: 200, 
    description: '답변 작성 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'reply-1' },
        postId: { type: 'string', example: 'post-1' },
        body: { type: 'string', example: '답변 내용' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: '인증 토큰이 없거나 유효하지 않음' })
  createReply(@Body() body: QnaReplyDto) {
    return {
      id: 'reply-1',
      ...body
    };
  }

  @Get('posts')
  @ApiOperation({ summary: 'Q&A 게시글 목록 조회' })
  @ApiQuery({ name: 'subjectId', required: false, description: '과목 ID' })
  @ApiQuery({ name: 'lessonId', required: false, description: '레슨 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '게시글 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        items: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'post-1' },
              title: { type: 'string', example: '질문 제목' },
              body: { type: 'string', example: '질문 내용' }
            }
          }
        }
      }
    }
  })
  getPosts(
    @Query('subjectId') subjectId?: string,
    @Query('lessonId') lessonId?: string
  ) {
    return {
      items: [
        {
          id: 'post-1',
          title: '질문 제목',
          body: '질문 내용'
        }
      ]
    };
  }
}
