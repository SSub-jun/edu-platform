const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateVideoUrls() {
  try {
    // 모든 VideoPart를 가져옴
    const videoParts = await prisma.videoPart.findMany();
    
    console.log(`총 ${videoParts.length}개의 비디오를 찾았습니다.`);
    
    for (const video of videoParts) {
      if (video.videoUrl && video.videoUrl.includes('/temp/')) {
        // temp 경로를 제거
        const newUrl = video.videoUrl.replace(/\/temp\//, '/');
        
        await prisma.videoPart.update({
          where: { id: video.id },
          data: { videoUrl: newUrl }
        });
        
        console.log(`✅ 업데이트: ${video.videoUrl} -> ${newUrl}`);
      } else if (video.videoUrl && video.videoUrl.match(/\/videos\/[^\/]+\/video-/)) {
        // lessonId가 포함된 경로를 수정
        const filename = video.videoUrl.split('/').pop();
        const newUrl = `/uploads/videos/${filename}`;
        
        await prisma.videoPart.update({
          where: { id: video.id },
          data: { videoUrl: newUrl }
        });
        
        console.log(`✅ 업데이트: ${video.videoUrl} -> ${newUrl}`);
      } else {
        console.log(`⏭️  스킵: ${video.videoUrl} (이미 올바른 형식)`);
      }
    }
    
    console.log('\n완료!');
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVideoUrls();


