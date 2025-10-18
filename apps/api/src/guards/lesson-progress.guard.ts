import { Injectable, CanActivate, ExecutionContext, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonProgressGuard implements CanActivate {
	constructor(private prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.sub;
		const lessonId = request.params?.lessonId || request.params?.id;

		if (!userId || !lessonId) {
			throw new UnprocessableEntityException('인증 정보 또는 레슨 정보가 없습니다.');
		}

		// 사용자의 레슨 진도 조회
		const progress = await this.prisma.progress.findUnique({
			where: {
				userId_lessonId: {
					userId,
					lessonId
				}
			}
		});

		const progressPercent = progress?.progressPercent || 0;

		if (progressPercent < 90) {
			throw new UnprocessableEntityException({
				code: 'PROGRESS_NOT_ENOUGH',
				message: '진도율이 90% 이상이어야 시험에 응시할 수 있습니다.',
				need: 90,
				current: progressPercent
			});
		}

		return true;
	}
}
