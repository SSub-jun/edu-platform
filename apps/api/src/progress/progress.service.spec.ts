import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { PingProgressDto } from './dto/progress.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProgressService', () => {
  let service: ProgressService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    subject: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    subjectProgress: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    progress: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    videoPart: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { durationMs: 600000 } }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pingProgress', () => {
    const mockSubject = {
      id: 'subject-1',
      name: '수학',
      isActive: true,
      lessons: [
        { id: 'lesson-1', title: '1장: 수와 연산', order: 1, isActive: true },
        { id: 'lesson-2', title: '2장: 방정식', order: 2, isActive: true },
      ],
    };

    const mockProgress = {
      id: 'progress-1',
      userId: 'user-1',
      subjectId: 'subject-1',
      progressPercent: 25.5,
      lastLessonId: 'lesson-1',
      lastPartId: 'part-1',
      lastPlayedMs: 300000,
    };

    it('should update progress and mark lesson as completed when progressPercent >= 90', async () => {
      const pingDto: PingProgressDto = {
        subjectId: 'subject-1',
        lessonId: 'lesson-1',
        partId: 'part-1',
        playedMs: 600000, // 충분한 재생 시간으로 90% 이상 달성
      };

      mockPrismaService.subject.findUnique.mockResolvedValue(mockSubject);
      mockPrismaService.progress.findUnique.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        progressPercent: 0,
        status: 'inProgress'
      });
      mockPrismaService.progress.update.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        progressPercent: 95,
        status: 'completed'
      });

      const result = await service.pingProgress('user-1', pingDto);

      expect(mockPrismaService.progress.update).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
        data: {
          progressPercent: expect.any(Number),
          status: 'completed',
          completedAt: expect.any(Date)
        }
      });
      expect(result).toBeDefined();
    });

    it('should not mark lesson as completed when progressPercent < 90', async () => {
      const pingDto: PingProgressDto = {
        subjectId: 'subject-1',
        lessonId: 'lesson-1',
        partId: 'part-1',
        playedMs: 60000, // 적은 재생 시간으로 90% 미만
      };

      mockPrismaService.subject.findUnique.mockResolvedValue(mockSubject);
      mockPrismaService.progress.findUnique.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        progressPercent: 0,
        status: 'inProgress'
      });
      mockPrismaService.progress.update.mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        progressPercent: 25,
        status: 'inProgress'
      });

      const result = await service.pingProgress('user-1', pingDto);

      expect(mockPrismaService.progress.update).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
        data: {
          progressPercent: expect.any(Number),
          status: 'inProgress',
          completedAt: null
        }
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when subject not found', async () => {
      const pingDto: PingProgressDto = {
        subjectId: 'invalid-subject',
        lessonId: 'lesson-1',
        playedMs: 60000,
      };

      mockPrismaService.subject.findUnique.mockResolvedValue(null);

      await expect(service.pingProgress('user-1', pingDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getNextAvailable', () => {
    const mockSubjects = [
      {
        id: 'subject-1',
        name: '수학',
        isActive: true,
        order: 1,
        lessons: [
          { id: 'lesson-1', title: '1장: 수와 연산', order: 1, isActive: true },
          { id: 'lesson-2', title: '2장: 방정식', order: 2, isActive: true },
          { id: 'lesson-3', title: '3장: 함수', order: 3, isActive: true },
        ],
      },
    ];

    const mockSubjectProgress = [
      {
        userId: 'user-1',
        subjectId: 'subject-1',
        progressPercent: 50.0,
        lastLessonId: 'lesson-1',
      },
    ];

    it('should return lock=true when current lesson progressPercent < 90', async () => {
      const mockLessonProgress = [
        { 
          userId: 'user-1', 
          lessonId: 'lesson-1', 
          progressPercent: 50,
          status: 'inProgress',
          lesson: {
            id: 'lesson-1',
            title: '1장: 수와 연산',
            order: 1,
            subject: { id: 'subject-1', name: '수학' }
          }
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrismaService.progress.findMany.mockResolvedValue(mockLessonProgress);

      const result = await service.getNextAvailable('user-1');

      // 현재 레슨의 progressPercent가 90% 미만이므로 다음 레슨은 잠겨있음
      expect(result.lock).toBe(true);
      expect(result.blockedBy).toEqual({
        lessonId: 'lesson-1',
        lessonTitle: '1장: 수와 연산',
        order: 1,
      });
    });

    it('should return lock=false when current lesson progressPercent >= 90', async () => {
      const mockLessonProgress = [
        { 
          userId: 'user-1', 
          lessonId: 'lesson-1', 
          progressPercent: 95,
          status: 'completed',
          lesson: {
            id: 'lesson-1',
            title: '1장: 수와 연산',
            order: 1,
            subject: { id: 'subject-1', name: '수학' }
          }
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrismaService.progress.findMany.mockResolvedValue(mockLessonProgress);

      const result = await service.getNextAvailable('user-1');

      expect(result.lock).toBe(false);
      expect(result.blockedBy).toBeNull();
    });

    it('should return lock=false when all previous lessons are completed', async () => {
      const mockLessonProgress = [
        { 
          userId: 'user-1', 
          lessonId: 'lesson-1', 
          progressPercent: 95,
          status: 'completed',
          lesson: {
            id: 'lesson-1',
            title: '1장: 수와 연산',
            order: 1,
            subject: { id: 'subject-1', name: '수학' }
          }
        },
        { 
          userId: 'user-1', 
          lessonId: 'lesson-2', 
          progressPercent: 95,
          status: 'completed',
          lesson: {
            id: 'lesson-2',
            title: '2장: 방정식',
            order: 2,
            subject: { id: 'subject-1', name: '수학' }
          }
        },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrismaService.progress.findMany.mockResolvedValue(mockLessonProgress);

      const result = await service.getNextAvailable('user-1');

      expect(result.lock).toBe(false);
      expect(result.blockedBy).toBeNull();
    });

    it('should return lock=false for first lesson (order=1)', async () => {
      const mockLessonProgress = [];

      mockPrismaService.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrismaService.subjectProgress.findMany.mockResolvedValue([]);
      mockPrismaService.progress.findMany.mockResolvedValue(mockLessonProgress);

      const result = await service.getNextAvailable('user-1');

      expect(result.lock).toBe(false);
      expect(result.blockedBy).toBeNull();
    });

    it('should return empty result when no subjects exist', async () => {
      mockPrismaService.subject.findMany.mockResolvedValue([]);

      const result = await service.getNextAvailable('user-1');

      expect(result.nextSubject).toBeNull();
      expect(result.currentSubject).toBeNull();
      expect(result.lock).toBe(false);
      expect(result.blockedBy).toBeNull();
    });
  });
});
