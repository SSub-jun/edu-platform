import { Controller, Get, Post, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Auth, Roles } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';

class QnaPostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()  
  @IsNotEmpty()
  body: string;
}

class QnaReplyDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

@ApiTags('QnA')
@Controller('qna')
export class QnaController {
  constructor(private prisma: PrismaService) {}

  @Post('posts')
  @Auth()
  @ApiOperation({ summary: '질문 작성 (학생)' })
  @ApiBody({ type: QnaPostDto })
  @ApiResponse({ status: 201, description: '질문 작성 성공' })
  async createPost(@Body() dto: QnaPostDto, @Request() req: any) {
    return this.prisma.qnaPost.create({
      data: {
        title: dto.title,
        body: dto.body,
        userId: req.user.sub,
      },
      include: {
        user: {
          select: {
            username: true,
            role: true,
          }
        }
      }
    });
  }

  @Post('replies')
  @Auth()
  @ApiOperation({ summary: '답변 작성 (강사)' })
  @ApiBody({ type: QnaReplyDto })
  @ApiResponse({ status: 201, description: '답변 작성 성공' })
  async createReply(@Body() dto: QnaReplyDto, @Request() req: any) {
    return this.prisma.qnaReply.create({
      data: {
        postId: dto.postId,
        body: dto.body,
        userId: req.user.sub,
      },
      include: {
        user: {
          select: {
            username: true,
            role: true,
          }
        }
      }
    });
  }

  @Get('posts')
  @Auth()
  @ApiOperation({ summary: 'Q&A 목록 조회' })
  @ApiResponse({ status: 200, description: 'Q&A 목록 조회 성공' })
  async getPosts() {
    return this.prisma.qnaPost.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                username: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  @Delete('posts/:id')
  @Auth()
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: '질문 삭제 (관리자/강사)' })
  @ApiParam({ name: 'id', description: '질문 ID' })
  @ApiResponse({ status: 200, description: '질문 삭제 성공' })
  async deletePost(@Param('id') postId: string) {
    // Cascade로 답변도 함께 삭제됨
    await this.prisma.qnaPost.delete({
      where: { id: postId }
    });

    return {
      success: true,
      message: '질문이 삭제되었습니다.'
    };
  }

  @Delete('replies/:id')
  @Auth()
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: '답변 삭제 (관리자/강사)' })
  @ApiParam({ name: 'id', description: '답변 ID' })
  @ApiResponse({ status: 200, description: '답변 삭제 성공' })
  async deleteReply(@Param('id') replyId: string) {
    await this.prisma.qnaReply.delete({
      where: { id: replyId }
    });

    return {
      success: true,
      message: '답변이 삭제되었습니다.'
    };
  }
}