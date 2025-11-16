import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto, CreateLessonPartDto, UpdateLessonPartDto } from './dto/lesson.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class AdminLessonService {
  constructor(private readonly prisma: PrismaService) {}

  // =============== 레슨 관리 ===============

  async createLesson(subjectId: string, dto: CreateLessonDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        subjectId,
        title: dto.title,
        description: dto.description,
        order: dto.order,
        isActive: true,
      },
      include: {
        videoParts: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return lesson;
  }

  async getLessonsBySubject(subjectId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { subjectId },
      include: {
        videoParts: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return lessons;
  }

  async getLessonById(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        subject: true,
        videoParts: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson;
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: dto.title,
        description: dto.description,
        order: dto.order,
        isActive: dto.isActive,
      },
      include: {
        videoParts: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return updated;
  }

  async deleteLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { isActive: false },
    });

    return { success: true, message: 'Lesson deactivated successfully' };
  }

  // =============== 레슨 파트 관리 ===============

  async createLessonPart(lessonId: string, dto: CreateLessonPartDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const part = await this.prisma.videoPart.create({
      data: {
        lessonId,
        title: dto.title,
        description: dto.description,
        order: dto.order,
        videoUrl: dto.videoUrl,
        durationMs: dto.durationMs,
        isActive: true,
      },
    });

    return part;
  }

  async getLessonParts(lessonId: string) {
    const parts = await this.prisma.videoPart.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });

    return parts;
  }

  async updateLessonPart(partId: string, dto: UpdateLessonPartDto) {
    const part = await this.prisma.videoPart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      throw new NotFoundException(`Lesson part with ID ${partId} not found`);
    }

    const updated = await this.prisma.videoPart.update({
      where: { id: partId },
      data: {
        title: dto.title,
        description: dto.description,
        order: dto.order,
        videoUrl: dto.videoUrl,
        durationMs: dto.durationMs,
        isActive: dto.isActive,
      },
    });

    return updated;
  }

  async deleteLessonPart(partId: string) {
    const part = await this.prisma.videoPart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      throw new NotFoundException(`Lesson part with ID ${partId} not found`);
    }

    await this.prisma.videoPart.update({
      where: { id: partId },
      data: { isActive: false },
    });

    return { success: true, message: 'Lesson part deactivated successfully' };
  }

  // =============== 시험 문제 관리 ===============

  async createQuestion(subjectId: string, dto: CreateQuestionDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    // 정답 인덱스 유효성 검증
    if (dto.correctAnswer < 0 || dto.correctAnswer >= dto.choices.length) {
      throw new BadRequestException('correctAnswer must be a valid index of choices array');
    }

    // Choice 생성을 위한 데이터 준비
    const choicesData = dto.choices.map((text) => ({ text }));

    const question = await this.prisma.question.create({
      data: {
        subjectId,
        stem: dto.content,
        answerIndex: dto.correctAnswer,
        explanation: dto.explanation,
        isActive: true,
        choices: {
          create: choicesData,
        },
      },
      include: {
        choices: true,
      },
    });

    return question;
  }

  async getQuestionsBySubject(subjectId: string) {
    const questions = await this.prisma.question.findMany({
      where: { subjectId },
      include: {
        choices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 프론트엔드 형식으로 변환
    return questions.map((q) => ({
      id: q.id,
      content: q.stem,
      choices: q.choices.map((c) => c.text),
      correctAnswer: q.answerIndex,
      explanation: q.explanation,
      difficulty: 3, // 기본값
      tags: '', // 기본값
      isActive: q.isActive,
      createdAt: q.createdAt,
    }));
  }

  async getQuestionById(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: true,
        choices: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 프론트엔드 형식으로 변환
    return {
      id: question.id,
      content: question.stem,
      choices: question.choices.map((c) => c.text),
      correctAnswer: question.answerIndex,
      explanation: question.explanation,
      difficulty: 3,
      tags: '',
      isActive: question.isActive,
      createdAt: question.createdAt,
    };
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        choices: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 정답 인덱스 유효성 검증
    const finalChoices = dto.choices || question.choices.map((c) => c.text);
    const finalCorrectAnswer = dto.correctAnswer !== undefined ? dto.correctAnswer : question.answerIndex;

    if (finalCorrectAnswer < 0 || finalCorrectAnswer >= finalChoices.length) {
      throw new BadRequestException('correctAnswer must be a valid index of choices array');
    }

    // 기존 choices 삭제 후 새로 생성 (choices가 제공된 경우)
    if (dto.choices) {
      await this.prisma.choice.deleteMany({
        where: { questionId },
      });
    }

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        stem: dto.content,
        answerIndex: dto.correctAnswer,
        explanation: dto.explanation,
        isActive: dto.isActive,
        ...(dto.choices && {
          choices: {
            create: dto.choices.map((text) => ({ text })),
          },
        }),
      },
      include: {
        choices: true,
      },
    });

    // 프론트엔드 형식으로 변환
    return {
      id: updated.id,
      content: updated.stem,
      choices: updated.choices.map((c) => c.text),
      correctAnswer: updated.answerIndex,
      explanation: updated.explanation,
      difficulty: 3,
      tags: '',
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    };
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    await this.prisma.question.update({
      where: { id: questionId },
      data: { isActive: false },
    });

    return { success: true, message: 'Question deactivated successfully' };
  }

  async duplicateQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        choices: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const duplicated = await this.prisma.question.create({
      data: {
        subjectId: question.subjectId,
        stem: question.stem + ' (복사본)',
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        isActive: true,
        choices: {
          create: question.choices.map((c) => ({ text: c.text })),
        },
      },
      include: {
        choices: true,
      },
    });

    // 프론트엔드 형식으로 변환
    return {
      id: duplicated.id,
      content: duplicated.stem,
      choices: duplicated.choices.map((c) => c.text),
      correctAnswer: duplicated.answerIndex,
      explanation: duplicated.explanation,
      difficulty: 3,
      tags: '',
      isActive: duplicated.isActive,
      createdAt: duplicated.createdAt,
    };
  }
}

