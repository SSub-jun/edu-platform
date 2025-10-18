import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActiveLessonGuard implements CanActivate {
	constructor(private prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.sub;
		const lessonId = request.params?.lessonId || request.params?.id;

		if (!userId || !lessonId) {
			throw new ForbiddenException('인증 정보 또는 레슨 정보가 없습니다.');
		}

		// 사용자의 회사 정보 조회
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: {
				company: {
					include: {
						activeLessons: {
							where: { lessonId }
						}
					}
				}
			}
		});

		if (!user || !user.company) {
			throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
		}

		// 활성 레슨에 포함되는지 확인
		const isActiveLesson = user.company.activeLessons.length > 0;
		if (!isActiveLesson) {
			throw new ForbiddenException('LESSON_NOT_ACTIVE_FOR_COMPANY');
		}

		return true;
	}
}
