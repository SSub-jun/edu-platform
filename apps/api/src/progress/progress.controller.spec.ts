import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ProgressController } from './progress.controller';

describe('ProgressController', () => {
  let controller: ProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [ProgressController],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkVerificationNeeded', () => {
    it('should return needed: false when VERIFY_ON_COURSE_START is not set to true', async () => {
      // 환경변수 설정
      delete process.env.VERIFY_ON_COURSE_START;
      
      const result = await controller.checkVerificationNeeded('subject-1');
      expect(result).toEqual({ needed: false });
    });

    it('should return needed: true when VERIFY_ON_COURSE_START is set to true', async () => {
      // 환경변수 설정
      process.env.VERIFY_ON_COURSE_START = 'true';
      
      const result = await controller.checkVerificationNeeded('subject-1');
      expect(result).toEqual({ needed: true });
    });

    it('should return needed: false when VERIFY_ON_COURSE_START is set to false', async () => {
      // 환경변수 설정
      process.env.VERIFY_ON_COURSE_START = 'false';
      
      const result = await controller.checkVerificationNeeded('subject-1');
      expect(result).toEqual({ needed: false });
    });

    it('should return needed: false when VERIFY_ON_COURSE_START is set to invalid value', async () => {
      // 환경변수 설정
      process.env.VERIFY_ON_COURSE_START = 'invalid';
      
      const result = await controller.checkVerificationNeeded('subject-1');
      expect(result).toEqual({ needed: false });
    });
  });
});
