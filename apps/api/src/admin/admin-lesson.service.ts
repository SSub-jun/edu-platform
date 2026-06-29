import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  CreateLessonPartDto,
  UpdateLessonPartDto,
} from './dto/lesson.dto';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionTranslationInput,
} from './dto/question.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class AdminLessonService {
  constructor(private readonly prisma: PrismaService) {}

  // =============== 과목 관리 ===============

  async createSubject(dto: CreateSubjectDto) {
    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        description: dto.description,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return subject;
  }

  async getSubjects() {
    const subjects = await this.prisma.subject.findMany({
      include: {
        lessons: {
          where: { isActive: true },
        },
        questions: {
          where: { isActive: true },
        },
        _count: {
          select: {
            subjectProgress: true,
            examAttempts: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      order: subject.order,
      isActive: subject.isActive,
      lessonsCount: subject.lessons.length,
      questionsCount: subject.questions.length,
      studentsCount: subject._count.subjectProgress,
      examAttemptsCount: subject._count.examAttempts,
      createdAt: subject.createdAt,
    }));
  }

  async getSubjectDetail(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            videoParts: {
              orderBy: { order: 'asc' },
            },
          },
        },
        questions: {
          orderBy: { createdAt: 'desc' },
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: {
            subjectProgress: true,
            examAttempts: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    return {
      ...subject,
      studentsCount: subject._count.subjectProgress,
      examAttemptsCount: subject._count.examAttempts,
    };
  }

  async updateSubject(subjectId: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    const updated = await this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: dto.name ?? subject.name,
        description: dto.description ?? subject.description,
        order: dto.order ?? subject.order,
        isActive: dto.isActive ?? subject.isActive,
      },
    });

    return updated;
  }

  async deleteSubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    await this.prisma.subject.update({
      where: { id: subjectId },
      data: { isActive: false },
    });

    return { success: true, message: 'Subject deactivated successfully' };
  }

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
      throw new BadRequestException(
        'correctAnswer must be a valid index of choices array',
      );
    }

    // Choice 생성을 위한 데이터 준비
    const choicesData = dto.choices.map((text, index) => ({
      text,
      order: index,
      isAnswer: index === dto.correctAnswer,
    }));

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

    await this.saveQuestionTranslations(question.id, dto.translations);

    return this.formatQuestion(question);
  }

  async getQuestionsBySubject(subjectId: string) {
    const questions = await this.prisma.question.findMany({
      where: { subjectId },
      include: this.questionInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return questions.map((q) => this.formatQuestion(q));
  }

  async getQuestionById(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: true,
        ...this.questionInclude(),
      } as any,
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return this.formatQuestion(question);
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: this.questionInclude(),
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 정답 인덱스 유효성 검증
    const finalChoices = dto.choices || question.choices.map((c) => c.text);
    const finalCorrectAnswer =
      dto.correctAnswer !== undefined
        ? dto.correctAnswer
        : question.answerIndex;

    if (finalCorrectAnswer < 0 || finalCorrectAnswer >= finalChoices.length) {
      throw new BadRequestException(
        'correctAnswer must be a valid index of choices array',
      );
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
            create: dto.choices.map((text, index) => ({
              text,
              order: index,
              isAnswer: index === finalCorrectAnswer,
            })),
          },
        }),
      },
      include: this.questionInclude(),
    });

    await this.saveQuestionTranslations(questionId, dto.translations);

    const withTranslations = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: this.questionInclude(),
    });

    return this.formatQuestion(withTranslations || updated);
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
      include: this.questionInclude(),
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
          create: question.choices.map((c) => ({
            text: c.text,
            order: c.order,
            isAnswer: c.isAnswer,
          })),
        },
      },
      include: this.questionInclude(),
    });

    await this.saveQuestionTranslations(
      duplicated.id,
      this.formatQuestion(question).translations,
    );

    return this.formatQuestion(duplicated);
  }

  private questionInclude() {
    return {
      choices: {
        orderBy: { order: 'asc' as const },
        include: {
          translations: true,
        },
      },
      translations: true,
    };
  }

  private formatQuestion(question: any) {
    const choices = [...(question.choices || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    const translations: QuestionTranslationInput = {};

    for (const translation of question.translations || []) {
      translations[translation.locale] = {
        content: translation.stem,
        explanation: translation.explanation ?? undefined,
        choices: choices.map((choice) => {
          const choiceTranslation = choice.translations?.find(
            (item: any) => item.locale === translation.locale,
          );
          return choiceTranslation?.text || '';
        }),
      };
    }

    return {
      id: question.id,
      content: question.stem,
      stem: question.stem,
      choices: choices.map((c) => c.text),
      choiceDetails: choices.map((c) => ({
        id: c.id,
        text: c.text,
        isAnswer: c.isAnswer,
        order: c.order,
      })),
      choiceTexts: choices.map((c) => c.text),
      correctAnswer: question.answerIndex,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      translations,
      difficulty: 3,
      tags: '',
      isActive: question.isActive,
      createdAt: question.createdAt,
    };
  }

  private async saveQuestionTranslations(
    questionId: string,
    translations?: QuestionTranslationInput,
  ) {
    if (!translations) return;

    const choices = await this.prisma.choice.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
    });

    for (const [locale, translation] of Object.entries(translations)) {
      const content = translation.content?.trim();
      const explanation = translation.explanation?.trim();
      const translatedChoices = translation.choices || [];
      const hasChoiceTranslation = translatedChoices.some((choice) => choice?.trim());

      if (!content && !explanation && !hasChoiceTranslation) {
        await this.prisma.questionTranslation.deleteMany({
          where: { questionId, locale },
        });
        await this.prisma.choiceTranslation.deleteMany({
          where: {
            locale,
            choiceId: { in: choices.map((choice) => choice.id) },
          },
        });
        continue;
      }

      if (content) {
        await this.prisma.questionTranslation.upsert({
          where: {
            questionId_locale: {
              questionId,
              locale,
            },
          },
          create: {
            questionId,
            locale,
            stem: content,
            explanation: explanation || null,
          },
          update: {
            stem: content,
            explanation: explanation || null,
          },
        });
      }

      await Promise.all(
        choices.map((choice, index) => {
          const text = translatedChoices[index]?.trim();
          if (!text) {
            return this.prisma.choiceTranslation.deleteMany({
              where: { choiceId: choice.id, locale },
            });
          }

          return this.prisma.choiceTranslation.upsert({
            where: {
              choiceId_locale: {
                choiceId: choice.id,
                locale,
              },
            },
            create: {
              choiceId: choice.id,
              locale,
              text,
            },
            update: { text },
          });
        }),
      );
    }
  }
}
