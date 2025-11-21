import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-value'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService - Cohort auto assignment', () => {
  let service: AuthService;
  let prisma: {
    userCohort: {
      findFirst: jest.Mock;
      upsert: jest.Mock;
    };
    cohort: {
      findFirst: jest.Mock;
    };
  };
  let config: { get: jest.Mock };

  const createService = () => {
    service = new AuthService(
      config as unknown as ConfigService,
      {} as JwtService,
      prisma as unknown as PrismaService,
      {} as OtpService,
    );
  };

  beforeEach(() => {
    prisma = {
      userCohort: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      cohort: {
        findFirst: jest.fn(),
      },
    };

    config = {
      get: jest.fn((key: string, defaultValue?: string) =>
        defaultValue ?? null,
      ),
    };

    createService();
  });

  const enableAutoAssign = () => {
    config.get.mockImplementation(
      (key: string, defaultValue?: string | null) => {
        if (key === 'COHORT_AUTO_ASSIGN_ENABLED') {
          return 'true';
        }
        return defaultValue ?? null;
      },
    );
  };

  it('auto assigns running cohort when available', async () => {
    enableAutoAssign();
    const runningCohort = { id: 'cohort-running' };
    prisma.userCohort.findFirst.mockResolvedValue(null);
    prisma.cohort.findFirst.mockResolvedValueOnce(runningCohort);

    await (service as any).tryAutoAssignUserToCohort('user-1', 'comp-1');

    expect(prisma.cohort.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.userCohort.upsert).toHaveBeenCalledWith({
      where: {
        userId_cohortId: {
          userId: 'user-1',
          cohortId: 'cohort-running',
        },
      },
      create: {
        userId: 'user-1',
        cohortId: 'cohort-running',
      },
      update: {},
    });
  });

  it('falls back to upcoming cohort when no running cohort exists', async () => {
    enableAutoAssign();
    const upcomingCohort = { id: 'cohort-upcoming' };
    prisma.userCohort.findFirst.mockResolvedValue(null);
    prisma.cohort.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(upcomingCohort);

    await (service as any).tryAutoAssignUserToCohort('user-2', 'comp-2');

    expect(prisma.cohort.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.userCohort.upsert).toHaveBeenCalledWith({
      where: {
        userId_cohortId: {
          userId: 'user-2',
          cohortId: 'cohort-upcoming',
        },
      },
      create: {
        userId: 'user-2',
        cohortId: 'cohort-upcoming',
      },
      update: {},
    });
  });

  it('skips assignment if user already linked to a cohort', async () => {
    enableAutoAssign();
    prisma.userCohort.findFirst.mockResolvedValue({ id: 'existing' });

    await (service as any).tryAutoAssignUserToCohort('user-3', 'comp-3');

    expect(prisma.cohort.findFirst).not.toHaveBeenCalled();
    expect(prisma.userCohort.upsert).not.toHaveBeenCalled();
  });
});

describe('AuthService - register flow hooks', () => {
  let service: AuthService;
  let prisma: any;
  let config: { get: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let otpService: { verifyOtpToken: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
      },
      session: {
        create: jest.fn(),
      },
    };

    config = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'COHORT_AUTO_ASSIGN_ENABLED') {
          return 'true';
        }
        if (key === 'JWT_SECRET') {
          return 'jwt-secret';
        }
        if (key === 'REFRESH_TOKEN_TTL') {
          return '7d';
        }
        if (key === 'ACCESS_TOKEN_TTL') {
          return '15m';
        }
        return defaultValue ?? null;
      }),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    otpService = {
      verifyOtpToken: jest.fn(),
    };

    service = new AuthService(
      config as unknown as ConfigService,
      jwtService as unknown as JwtService,
      prisma as unknown as PrismaService,
      otpService as unknown as OtpService,
    );
  });

  it('auto assigns cohort when registering with invite code', async () => {
    otpService.verifyOtpToken.mockResolvedValue({ phone: '01012345678' });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      username: '01012345678',
      phone: '01012345678',
      companyId: 'company-1',
      role: 'student',
    });
    prisma.session.create.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
    });
    prisma.user.update.mockResolvedValue(null);

    const autoAssignSpy = jest
      .spyOn(service as any, 'tryAutoAssignUserToCohort')
      .mockResolvedValue(null);

    await service.register(
      '01012345678',
      'otp-token',
      'Password123!',
      '홍길동',
      'INVITE01',
    );

    expect(autoAssignSpy).toHaveBeenCalledWith('user-1', 'company-1');
  });
});

