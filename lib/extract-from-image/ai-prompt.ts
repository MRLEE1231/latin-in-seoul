import type { ExtractedFields } from './tesseract-parser';

/** 모든 AI 모델에 공통으로 보내는 이미지 추출용 프롬프트 */
export const EXTRACTION_PROMPT = `이 이미지는 라틴 댄스 수업 안내 포스터입니다. 아래 규칙에 따라 시각적 텍스트를 분석하여 JSON으로만 응답하세요.

### 📍 지역 분류 규칙:
1. **GANGNAM**: 강남역, 역삼, 선릉, 삼성, 논현, 신논현, 양재, 신사, 압구정, 매봉, 도곡. (강남구/서초구 주소 포함 시)
2. **HONGDAE**: 홍대입구, 합정, 상수, 망원, 연남, 동교동, 서교동, 성산동, 신촌, 이대. (마포구/서대문구 주소 포함 시)
3. **ETC**: 그 외 지역.
* 포스터에 강남/홍대 수업이 모두 있다면 둘 다 배열에 넣으세요.

### 📋 추출 및 계산 세부 규칙:
1. **연도 설정**: 연도 표기가 없으면 2026년을 기본값으로 합니다. (이미지에 2025년이 명시된 경우는 2025년 우선)
2. **기간 계산**: "휴강" 문구가 있다면 해당 주를 포함하여 실제 종강일(마지막 수업일)을 endDate로 설정하세요. 
3. **강사명 추출**: 아래 강사 목록을 참고하되, 포스터에 언급된 '이름'만 추출하세요. ('~쌤', '~선생님' 등은 제외)
   [정훈, 주희, 인우, INWOO, 끌루이, 달라, 오스틴, 카이닝, 로렌, 그레이, 주철, 백호, 몽, 천여지, 허그, 메이, 핸슨, 흑사탕, 민이]
4. **수업종류(danceType)**: SALSA, BACHATA, ZOUK, KIZOMBA 중 해당되는 것을 모두 배열로 담으세요.
5. **제목(title)**: 수업의 특징이 가장 잘 드러나는 가장 크고 굵은 텍스트를 추출하세요.

### ⚠️ JSON Output 형식 (엄격 준수):
{
  "title": "수업 제목",
  "region": ["GANGNAM"],
  "danceType": ["SALSA", "BACHATA"],
  "instructorName": ["이름1", "이름2"],
  "classDays": ["MON", "WED"],
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "keywords": "레벨, 수업특징(샤인, 패턴 등), 특이사항"
}
* 알 수 없거나 정보가 없으면 null을 반환하세요.`;

/** AI 응답 JSON 객체를 ExtractedFields로 정규화 (문자열/배열 혼용 대응) */
export function parseAIResponse(parsed: Record<string, unknown>): ExtractedFields {
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const str = (v: unknown): string | undefined => (typeof v === 'string' && v) ? v : undefined;
  const firstStr = (v: unknown): string | undefined => {
    if (typeof v === 'string' && v) return v;
    if (Array.isArray(v) && v.length) return typeof v[0] === 'string' ? v[0] : undefined;
    return undefined;
  };
  const instructorVal = parsed.instructorName;
  const instructorStr =
    typeof instructorVal === 'string'
      ? instructorVal
      : Array.isArray(instructorVal)
        ? instructorVal.filter((x): x is string => typeof x === 'string').join(', ')
        : undefined;
  const keywordsVal = parsed.keywords;
  const keywordsStr =
    typeof keywordsVal === 'string'
      ? keywordsVal
      : Array.isArray(keywordsVal)
        ? keywordsVal.filter((x): x is string => typeof x === 'string').join(',')
        : undefined;

  return {
    title: str(parsed.title),
    region: arr(parsed.region).length ? arr(parsed.region) : undefined,
    danceType: firstStr(parsed.danceType),
    instructorName: instructorStr,
    classDays: arr(parsed.classDays).length ? arr(parsed.classDays) : undefined,
    startDate: str(parsed.startDate),
    endDate: str(parsed.endDate),
    keywords: keywordsStr,
  };
}

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'copilot';
