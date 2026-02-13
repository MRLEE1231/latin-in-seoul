const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('샘플 데이터 생성을 시작합니다...');

  const samplePosts = [
    {
      title: '강남 살사 초급반 모집',
      content: '살사의 기초부터 차근차근 배우고 싶으신 분들 환영합니다!',
      region: 'GANGNAM',
      danceType: 'SALSA',
      instructorName: '마이클',
      classDescription: '매주 화요일 저녁 8시, 강남역 인근 스튜디오에서 진행됩니다.',
      images: [
        'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80',
        'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80'
      ]
    },
    {
      title: '홍대 바차타 센슈얼 중급',
      content: '바차타 센슈얼의 깊이 있는 테크닉을 익혀보세요.',
      region: 'HONGDAE',
      danceType: 'BACHATA',
      instructorName: '안나',
      classDescription: '바차타 기본기가 있으신 분들을 위한 중급 과정입니다.',
      images: [
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80'
      ]
    },
    {
      title: '이태원 키좀바 올레벨',
      content: '감각적인 음악과 함께하는 키좀바의 세계로 초대합니다.',
      region: 'ETC',
      danceType: 'KIZOMBA',
      instructorName: '리카르도',
      classDescription: '누구나 참여 가능한 올레벨 수업입니다.',
      images: [
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80'
      ]
    },
    {
      title: '강남 바차타 루에다 특별 워크숍',
      content: '함께 즐기는 루에다의 즐거움을 느껴보세요!',
      region: 'GANGNAM',
      danceType: 'BACHATA',
      instructorName: '제이슨',
      classDescription: '원데이 워크숍으로 진행되는 특별 수업입니다.',
      images: [
        'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80'
      ]
    },
    {
      title: '홍대 살사 온2 베이직',
      content: '정통 뉴욕 스타일 살사를 기초부터 배웁니다.',
      region: 'HONGDAE',
      danceType: 'SALSA',
      instructorName: '사라',
      classDescription: '살사 온2 스타일 입문자를 위한 필수 코스.',
      images: [
        'https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=800&q=80'
      ]
    },
    {
      title: '압구정 바차타 모던 레이디 스타일링',
      content: '여성분들을 위한 아름다운 라인과 무브먼트 수업입니다.',
      region: 'GANGNAM',
      danceType: 'BACHATA',
      instructorName: '엘레나',
      classDescription: '솔로 스타일링에 집중하는 수업입니다.',
      images: [
        'https://images.unsplash.com/photo-1508204882722-c1dcb928509c?w=800&q=80'
      ]
    },
    {
      title: '홍대 일요 살사 정모 전 오픈강습',
      content: '소셜 댄스를 즐기기 전 가벼운 몸풀기 강습!',
      region: 'HONGDAE',
      danceType: 'SALSA',
      instructorName: '민호',
      classDescription: '매주 일요일 오후 5시, 파티 전 무료 오픈 강습입니다.',
      images: [
        'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&q=80'
      ]
    },
    {
      title: '분당 키좀바 어반 스타일',
      content: '모던한 음악에 맞춘 트렌디한 키좀바 수업.',
      region: 'ETC',
      danceType: 'KIZOMBA',
      instructorName: '다니엘',
      classDescription: '어반 키좀바의 독특한 무드를 느껴보세요.',
      images: [
        'https://images.unsplash.com/photo-1514525253361-b83f85df0f5c?w=800&q=80'
      ]
    },
    {
      title: '강남 화요 살사 중급 턴 스페셜',
      content: '화려한 턴 기술을 완성하고 싶은 분들께 추천합니다.',
      region: 'GANGNAM',
      danceType: 'SALSA',
      instructorName: '로이',
      classDescription: '중급 이상의 팔로워/리더 대상 수업입니다.',
      images: [
        'https://images.unsplash.com/photo-1502519144081-acca18599776?w=800&q=80'
      ]
    },
    {
      title: '홍대 바차타 센슈얼 커플 무브먼트',
      content: '파트너와의 호흡과 깊은 커넥션을 배우는 수업입니다.',
      region: 'HONGDAE',
      danceType: 'BACHATA',
      instructorName: '준 & 미나',
      classDescription: '바차타 센슈얼의 정수를 담은 커플 전용 수업입니다.',
      images: [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80'
      ]
    }
  ];

  for (const postData of samplePosts) {
    const { images, ...rest } = postData;
    await prisma.post.create({
      data: {
        ...rest,
        images: {
          create: images.map((url, index) => ({
            imageUrl: url,
            imageOrder: index
          }))
        }
      }
    });
  }

  console.log('10개의 샘플 데이터가 성공적으로 생성되었습니다!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
