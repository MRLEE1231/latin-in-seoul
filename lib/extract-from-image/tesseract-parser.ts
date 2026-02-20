/**
 * Tesseract OCR로 추출한 텍스트를 수업 게시글 필드로 파싱 (휴리스틱)
 */
export type ExtractedFields = {
  title?: string;
  region?: string[];
  danceType?: string;
  instructorName?: string;
  classDays?: string[];
  startDate?: string;
  endDate?: string;
  keywords?: string;
};

const REGION_MAP: Record<string, string> = {
  강남: 'GANGNAM',
  홍대: 'HONGDAE',
  기타: 'ETC',
};

const DANCE_MAP: Record<string, string> = {
  살사: 'SALSA',
  바차타: 'BACHATA',
  주크: 'ZOUK',
  키좀바: 'KIZOMBA',
  기타: 'ETC',
};

const DAY_MAP: Record<string, string> = {
  월: 'MON',
  화: 'TUE',
  수: 'WED',
  목: 'THU',
  금: 'FRI',
  토: 'SAT',
  일: 'SUN',
};

const MAX_REASONABLE_YEAR = new Date().getFullYear() + 1;

/** YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD 등 정규화 → YYYY-MM-DD. 연도가 비정상(OCR 오류)이면 올해/내년으로 보정 */
function normalizeDate(s: string): string | undefined {
  const match = s.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!match) return undefined;
  let [, y, m, d] = match;
  let year = parseInt(y, 10);
  if (year > MAX_REASONABLE_YEAR) year = MAX_REASONABLE_YEAR;
  if (year < 2020) year = new Date().getFullYear();
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** "2월5일", "2월 5일" → YYYY-MM-DD (올해/내년) */
function parseKoreanMonthDay(text: string): string | undefined {
  const match = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
  if (!match) return undefined;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const now = new Date();
  let year = now.getFullYear();
  const d = new Date(year, month - 1, day);
  if (d.getTime() < now.getTime()) year += 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** "4주", "4주간" → 주 수 */
function parseWeeksDuration(text: string): number | undefined {
  const m = text.match(/(\d+)\s*주\s*간?/);
  return m ? parseInt(m[1], 10) : undefined;
}

/** endDate = startDate + N주 */
function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + weeks * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseExtractedText(rawText: string): ExtractedFields {
  const out: ExtractedFields = {};
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const fullText = rawText;

  // 1) 한국어 "N월 N일" + "N주" 조합 우선 (예: 2월5일 목요일부터 4주)
  const koreanStart = parseKoreanMonthDay(fullText);
  const weeks = parseWeeksDuration(fullText);
  if (koreanStart) {
    out.startDate = koreanStart;
    if (weeks && weeks > 0) out.endDate = addWeeks(koreanStart, weeks);
  }

  // 2) 요일: "목요일", "목 요일", "목 요 일" 등 (OCR 공백 허용)
  const dayMatches = [...fullText.matchAll(/(월|화|수|목|금|토|일)\s*요\s*일/g)];
  if (dayMatches.length > 0) {
    out.classDays = [...new Set(dayMatches.map((m) => DAY_MAP[m[1]]).filter(Boolean))];
  }

  // 3) 전체 날짜 형식이 있으면 start/end 보조 (아직 없을 때만)
  const dateRegex = /\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g;
  const dates = [...fullText.matchAll(dateRegex)].map((m) => normalizeDate(m[0])).filter(Boolean) as string[];
  if (dates.length >= 1 && !out.startDate) out.startDate = dates[0];
  if (dates.length >= 2 && !out.endDate) out.endDate = dates[1];

  // 지역: 키워드 매칭
  const regions: string[] = [];
  for (const [label, value] of Object.entries(REGION_MAP)) {
    if (fullText.includes(label)) regions.push(value);
  }
  if (regions.length > 0) out.region = [...new Set(regions)];

  // 수업 종류
  for (const [label, value] of Object.entries(DANCE_MAP)) {
    if (fullText.includes(label)) {
      out.danceType = value;
      break;
    }
  }

  // 강사: "강사", "강사명", "teacher" 등 뒤의 단어/줄
  const instructorPatterns = [/강사\s*[:\s]*([^\n\r]+)/i, /강사명\s*[:\s]*([^\n\r]+)/i, /teacher\s*[:\s]*([^\n\r]+)/i];
  for (const re of instructorPatterns) {
    const m = fullText.match(re);
    if (m && m[1]) {
      out.instructorName = m[1].trim().slice(0, 100);
      break;
    }
  }

  // 요일은 위 "X요일" 패턴으로만 설정함. 단순 "월"/"일" 포함 검사는 하지 않음 (2월·5일 오탐 방지)

  // 제목: 첫 번째 비어 있지 않은 긴 줄(2자 이상) 또는 "수업", "모집" 포함 줄
  if (lines.length > 0) {
    const titleLine = lines.find((l) => l.length >= 2 && (l.includes('수업') || l.includes('모집') || l.includes('반'))) ?? lines[0];
    out.title = titleLine.slice(0, 200);
  }

  // 해시태그 형태 키워드
  const hashTags = fullText.match(/#[\w가-힣]+/g);
  if (hashTags && hashTags.length > 0) {
    out.keywords = hashTags.map((h) => h.replace(/^#/, '')).join(',');
  }

  return out;
}
