import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';

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

