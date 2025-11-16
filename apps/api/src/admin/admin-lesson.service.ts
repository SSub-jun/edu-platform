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
        parts: {
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
        parts: {
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
        parts: {
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
        parts: {
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

    const part = await this.prisma.lessonPart.create({
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
    const parts = await this.prisma.lessonPart.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });

    return parts;
  }

  async updateLessonPart(partId: string, dto: UpdateLessonPartDto) {
    const part = await this.prisma.lessonPart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      throw new NotFoundException(`Lesson part with ID ${partId} not found`);
    }

    const updated = await this.prisma.lessonPart.update({
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
    const part = await this.prisma.lessonPart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      throw new NotFoundException(`Lesson part with ID ${partId} not found`);
    }

    await this.prisma.lessonPart.update({
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

    const question = await this.prisma.question.create({
      data: {
        subjectId,
        content: dto.content,
        choices: dto.choices,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
        tags: dto.tags,
        isActive: true,
      },
    });

    return question;
  }

  async getQuestionsBySubject(subjectId: string) {
    const questions = await this.prisma.question.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' },
    });

    return questions;
  }

  async getQuestionById(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return question;
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 정답 인덱스 유효성 검증
    const finalChoices = dto.choices || question.choices;
    const finalCorrectAnswer = dto.correctAnswer !== undefined ? dto.correctAnswer : question.correctAnswer;

    if (finalCorrectAnswer < 0 || finalCorrectAnswer >= finalChoices.length) {
      throw new BadRequestException('correctAnswer must be a valid index of choices array');
    }

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        content: dto.content,
        choices: dto.choices,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
        tags: dto.tags,
        isActive: dto.isActive,
      },
    });

    return updated;
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
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const duplicated = await this.prisma.question.create({
      data: {
        subjectId: question.subjectId,
        content: question.content + ' (복사본)',
        choices: question.choices,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        tags: question.tags,
        isActive: true,
      },
    });

    return duplicated;
  }
}

