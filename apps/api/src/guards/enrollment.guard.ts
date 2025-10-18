import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentGuard implements CanActivate {
	constructor(private prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.sub;
		const lessonId = request.params?.lessonId || request.params?.id;

		if (!userId || !lessonId) {
			throw new ForbiddenException('인증 정보 또는 레슨 정보가 없습니다.');
		}

		// 사용자와 회사 정보 조회
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: {
				company: true
			}
		});

		if (!user || !user.company) {
			throw new ForbiddenException('NOT_ASSIGNED_TO_SUBJECT');
		}

		// 회사 수강기간 확인
		const now = new Date();
		if (now < user.company.startDate || now > user.company.endDate) {
			throw new UnprocessableEntityException('PERIOD_NOT_ACTIVE');
		}

		// 레슨 정보 조회하여 과목 확인
		const lesson = await this.prisma.lesson.findUnique({
			where: { id: lessonId },
			include: { subject: true }
		});

		if (!lesson) {
			throw new ForbiddenException('레슨을 찾을 수 없습니다.');
		}

		// 요청 객체에 레슨 정보 추가 (다른 가드에서 사용)
		request.lesson = lesson;

		return true;
	}
}
