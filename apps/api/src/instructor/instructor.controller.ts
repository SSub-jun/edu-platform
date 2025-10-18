import { Controller, Get, Post, Put, Delete, Body, Param, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Auth, Roles } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsNotEmpty, IsInt, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  order: number;
}

class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  isActive?: boolean;
}

class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  stem: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsArray()
  @IsString({ each: true })
  choices: string[];

  @IsInt()
  @Min(0)
  @Max(9)
  correctAnswerIndex: number;
}

class StudentListQueryDto {
  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}

@ApiTags('Instructor')
@Controller('instructor')
@Auth()
@ApiBearerAuth()
@Roles('instructor', 'admin')
export class InstructorController {
  constructor(private readonly prisma: PrismaService) {}

  // =============== 과목 관리 ===============

  @Get('subjects')
  @ApiOperation({ summary: '과목 목록 조회' })
  @ApiResponse({ status: 200, description: '과목 목록 조회 성공' })
  async getSubjects() {
    const subjects = await this.prisma.subject.findMany({
      where: { isActive: true },
      include: {
        lessons: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        questions: {
          where: { isActive: true },
          select: { id: true }
        },
        _count: {
          select: {
            subjectProgress: true,
            examAttempts: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    return {
      success: true,
      data: subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        order: subject.order,
        lessonsCount: subject.lessons.length,
        questionsCount: subject.questions.length,
        studentsCount: subject._count.subjectProgress,
        examAttemptsCount: subject._count.examAttempts,
        createdAt: subject.createdAt
      }))
    };
  }

  @Get('subjects/:id')
  @ApiOperation({ summary: '과목 상세 조회' })
  @ApiResponse({ status: 200, description: '과목 상세 조회 성공' })
  async getSubjectDetail(@Param('id') subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId, isActive: true },
      include: {
        lessons: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            videoParts: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        questions: {
          where: { isActive: true },
          include: {
            choices: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            subjectProgress: true,
            examAttempts: true
          }
        }
      }
    });

    if (!subject) {
      return { success: false, error: 'Subject not found' };
    }

    return {
      success: true,
      data: {
        ...subject,
        studentsCount: subject._count.subjectProgress,
        examAttemptsCount: subject._count.examAttempts
      }
    };
  }

  @Post('subjects')
  @ApiOperation({ summary: '과목 생성' })
  @ApiResponse({ status: 201, description: '과목 생성 성공' })
  async createSubject(@Body() dto: CreateSubjectDto) {
    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        description: dto.description,
        order: dto.order || 0,
        isActive: true
      }
    });

    return {
      success: true,
      data: subject
    };
  }

  @Put('subjects/:id')
  @ApiOperation({ summary: '과목 수정' })
  @ApiResponse({ status: 200, description: '과목 수정 성공' })
  async updateSubject(@Param('id') subjectId: string, @Body() dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.update({
      where: { id: subjectId },
      data: dto
    });

    return {
      success: true,
      data: subject
    };
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: '과목 삭제 (비활성화)' })
  @ApiResponse({ status: 200, description: '과목 삭제 성공' })
  async deleteSubject(@Param('id') subjectId: string) {
    await this.prisma.subject.update({
      where: { id: subjectId },
      data: { isActive: false }
    });

    return {
      success: true,
      message: 'Subject deactivated successfully'
    };
  }

  // =============== 레슨 관리 ===============

  @Post('subjects/:subjectId/lessons')
  @ApiOperation({ summary: '레슨 생성' })
  @ApiResponse({ status: 201, description: '레슨 생성 성공' })
  async createLesson(
    @Param('subjectId') subjectId: string,
    @Body() dto: CreateLessonDto
  ) {
    const lesson = await this.prisma.lesson.create({
      data: {
        subjectId,
        title: dto.title,
        description: dto.description,
        order: dto.order,
        isActive: true
      }
    });

    return {
      success: true,
      data: lesson
    };
  }

  @Delete('lessons/:id')
  @ApiOperation({ summary: '레슨 삭제 (비활성화)' })
  @ApiResponse({ status: 200, description: '레슨 삭제 성공' })
  async deleteLesson(@Param('id') lessonId: string) {
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { isActive: false }
    });

    return { success: true };
  }

  // =============== 시험 문제 관리 ===============

  @Get('subjects/:id/questions')
  @ApiOperation({ summary: '과목별 시험문제 목록' })
  @ApiResponse({ status: 200, description: '시험문제 목록 조회 성공' })
  async getSubjectQuestions(@Param('id') subjectId: string) {
    const questions = await this.prisma.question.findMany({
      where: { 
        subjectId: subjectId,
        isActive: true 
      },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: questions
    };
  }

  @Post('subjects/:id/questions')
  @ApiOperation({ summary: '시험문제 생성' })
  @ApiResponse({ status: 201, description: '시험문제 생성 성공' })
  async createQuestion(@Param('id') subjectId: string, @Body() dto: CreateQuestionDto) {
    // Subject 단위로 문제 생성 (lessonId 필요 없음)
    const question = await this.prisma.question.create({
      data: {
        stem: dto.stem,
        explanation: dto.explanation,
        answerIndex: dto.correctAnswerIndex,
        lessonId: null, // Subject 단위 문제는 lessonId 없음
        subjectId: subjectId,
        choices: {
          create: dto.choices.map((text, index) => ({
            text,
            order: index,
            isAnswer: index === dto.correctAnswerIndex
          }))
        }
      },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return {
      success: true,
      data: question
    };
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: '시험문제 삭제' })
  @ApiResponse({ status: 200, description: '시험문제 삭제 성공' })
  async deleteQuestion(@Param('id') questionId: string) {
    await this.prisma.question.update({
      where: { id: questionId },
      data: { isActive: false }
    });

    return {
      success: true,
      message: 'Question deactivated successfully'
    };
  }

  // =============== 학생 관리 ===============

  @Get('students')
  @ApiOperation({ summary: '학생 목록 및 진도 현황' })
  @ApiResponse({ status: 200, description: '학생 목록 조회 성공' })
  async getStudents(@Query() query: StudentListQueryDto) {
    const { subjectId, status, page = 1, limit = 20 } = query;
    
    const where: any = {
      role: 'student'
    };

    // 상태별 필터링
    if (status === 'active') {
      where.lastLoginAt = { not: null };
    } else if (status === 'inactive') {
      where.OR = [
        { lastLoginAt: null },
        { lastLoginAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7일 이상 미접속
      ];
    }

    const [students, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          subjectProgress: {
            where: subjectId ? { subjectId } : {},
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          examAttempts: {
            where: subjectId ? { subjectId } : {},
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { submittedAt: 'desc' },
            take: 5
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      success: true,
      data: {
        students: students.map(student => ({
          id: student.id,
          username: student.username,
          email: student.email,
          company: student.company,
          createdAt: student.createdAt,
          lastLoginAt: student.lastLoginAt,
          subjectProgress: student.subjectProgress,
          recentExams: student.examAttempts
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    };
  }

  @Get('students/:id')
  @ApiOperation({ summary: '개별 학생 상세 정보 조회' })
  @ApiResponse({ status: 200, description: '학생 상세 정보 조회 성공' })
  async getStudentDetail(@Param('id') studentId: string) {
    try {
      const student = await this.prisma.user.findUnique({
        where: { 
          id: studentId,
          role: 'student'
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          subjectProgress: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: {
              subject: {
                name: 'asc'
              }
            }
          },
          examAttempts: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { submittedAt: 'desc' },
            take: 10 // 최근 10개 시험 기록
          }
        }
      });

      if (!student) {
        return {
          success: false,
          error: 'Student not found'
        };
      }

      return {
        success: true,
        data: {
          id: student.id,
          name: student.username,
          email: student.email,
          enrollDate: student.createdAt,
          lastLoginAt: student.lastLoginAt,
          company: student.company,
          subjectProgress: student.subjectProgress,
          recentExams: student.examAttempts
        }
      };
    } catch (error) {
      console.error('Error fetching student detail:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  // =============== 통계 및 분석 ===============

  @Get('analytics/overview')
  @ApiOperation({ summary: '전체 현황 통계' })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  async getAnalyticsOverview() {
    const [
      totalStudents,
      activeStudents,
      totalSubjects,
      totalQuestions,
      recentExamAttempts
    ] = await Promise.all([
      // 총 학생 수
      this.prisma.user.count({
        where: { role: 'student' }
      }),
      // 활성 학생 수 (최근 7일 내 로그인)
      this.prisma.user.count({
        where: {
          role: 'student',
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // 총 과목 수
      this.prisma.subject.count({
        where: { isActive: true }
      }),
      // 총 문제 수
      this.prisma.question.count({
        where: { isActive: true }
      }),
      // 최근 시험 응시 현황
      this.prisma.examAttempt.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // 과목별 통계
    const subjectStats = await this.prisma.subject.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            subjectProgress: true,
            examAttempts: true,
            questions: true
          }
        },
        examAttempts: {
          where: {
            status: 'submitted',
            score: { not: null }
          },
          select: {
            score: true,
            passed: true
          }
        }
      }
    });

    const subjectAnalytics = subjectStats.map(subject => {
      const attempts = subject.examAttempts;
      const averageScore = attempts.length > 0 
        ? attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length 
        : 0;
      const passRate = attempts.length > 0
        ? (attempts.filter(attempt => attempt.passed).length / attempts.length) * 100
        : 0;

      return {
        id: subject.id,
        name: subject.name,
        studentsCount: subject._count.subjectProgress,
        questionsCount: subject._count.questions,
        examAttemptsCount: subject._count.examAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100
      };
    });

    return {
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          totalSubjects,
          totalQuestions,
          recentExamAttempts
        },
        subjects: subjectAnalytics
      }
    };
  }
}
