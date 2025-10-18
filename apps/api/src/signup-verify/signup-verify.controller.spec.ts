import { Test, TestingModule } from '@nestjs/testing';
import { SignupVerifyController } from './signup-verify.controller';

describe('SignupVerifyController', () => {
  let controller: SignupVerifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignupVerifyController],
    }).compile();

    controller = module.get<SignupVerifyController>(SignupVerifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestVerification', () => {
    it('should return mock requestId', async () => {
      const result = await controller.requestVerification({});
      expect(result).toEqual({ requestId: 'mock' });
    });
  });

  describe('confirmVerification', () => {
    it('should return ok: true', async () => {
      const result = await controller.confirmVerification({});
      expect(result).toEqual({ ok: true });
    });
  });
});
