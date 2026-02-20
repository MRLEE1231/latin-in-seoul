import path from 'path';
import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { getAdminSession } from '@/lib/auth';
import { parseExtractedText, type ExtractedFields } from '@/lib/extract-from-image/tesseract-parser';
import { EXTRACTION_PROMPT, parseAIResponse, type AIProvider } from '@/lib/extract-from-image/ai-prompt';

export const maxDuration = 60;

const VALID_DAYS = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
const MAX_YEAR = new Date().getFullYear() + 1;

function sanitizeExtractedData(data: ExtractedFields): ExtractedFields {
  const out = { ...data };
  if (out.startDate) {
    const y = parseInt(out.startDate.slice(0, 4), 10);
    if (y > MAX_YEAR) out.startDate = out.startDate.replace(/^\d{4}/, String(MAX_YEAR));
  }
  if (out.endDate) {
    const y = parseInt(out.endDate.slice(0, 4), 10);
    if (y > MAX_YEAR) out.endDate = out.endDate.replace(/^\d{4}/, String(MAX_YEAR));
  }
  if (out.classDays?.length) {
    out.classDays = out.classDays.map((d) => d.toUpperCase()).filter((d) => VALID_DAYS.has(d));
  }
  return out;
}

export type AISource = 'gemini' | 'openai' | 'claude' | 'copilot';
export type ExtractResponse =
  | { success: true; data: ExtractedFields; source: AISource | 'tesseract' }
  | { success: false; error: string };

/** Next/Webpack rewrites module paths; use process.cwd() so worker path is real filesystem. */
function getTesseractWorkerPath(): string {
  return path.join(
    process.cwd(),
    'node_modules',
    'tesseract.js',
    'src',
    'worker-script',
    'node',
    'index.js'
  );
}

async function runTesseract(imageBuffer: Buffer): Promise<ExtractedFields> {
  const workerPath = getTesseractWorkerPath();
  const { data } = await Tesseract.recognize(imageBuffer, 'kor+eng', {
    logger: () => {},
    workerPath,
  });
  return parseExtractedText(data.text);
}

function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? (err as { code: number }).code : null;
  return (
    code === 429 ||
    /quota|rate limit|resource exhausted|429|RESOURCE_EXHAUSTED/i.test(msg)
  );
}

function extractJsonFromText(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function runGemini(base64: string, mimeType: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const imagePart = {
    inlineData: {
      data: base64,
      mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
    },
  };
  const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
  return result.response.text();
}

async function runOpenAI(base64: string, mimeType: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return text;
}

async function runClaude(base64: string, mimeType: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64,
            },
          },
        ],
      },
    ],
  });
  const block = message.content.find((b) => b.type === 'text');
  const text = block && block.type === 'text' ? block.text : '';
  if (!text) throw new Error('Claude returned empty response');
  return text;
}

async function runCopilot(base64: string, mimeType: string): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  if (!endpoint || !apiKey) throw new Error('AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY are required for Copilot.');
  const OpenAI = (await import('openai')).default;
  const baseURL = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}`;
  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model: deployment,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Azure OpenAI returned empty response');
  return text;
}

async function runAIExtract(
  base64: string,
  mimeType: string,
  provider: AIProvider
): Promise<{ data: ExtractedFields; source: AISource }> {
  const config: Record<AIProvider, { envKey: string; run: () => Promise<string> }> = {
    gemini: {
      envKey: 'GEMINI_API_KEY',
      run: () => runGemini(base64, mimeType),
    },
    openai: {
      envKey: 'OPENAI_API_KEY',
      run: () => runOpenAI(base64, mimeType),
    },
    claude: {
      envKey: 'ANTHROPIC_API_KEY',
      run: () => runClaude(base64, mimeType),
    },
    copilot: {
      envKey: 'AZURE_OPENAI_API_KEY',
      run: () => runCopilot(base64, mimeType),
    },
  };
  const { envKey, run } = config[provider];
  if (!process.env[envKey]) {
    throw new Error(`${provider} 사용을 위해 환경 변수 ${envKey}를 설정해 주세요.`);
  }
  const text = await run();
  const parsed = extractJsonFromText(text);
  if (!parsed) throw new Error('AI가 JSON을 반환하지 않았습니다.');
  const data = sanitizeExtractedData(parseAIResponse(parsed));
  return { data, source: provider };
}

export async function POST(req: Request): Promise<NextResponse<ExtractResponse>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: '관리자 로그인이 필요합니다.' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image');
    const mode = (formData.get('mode') as string) || 'free';
    const provider = (formData.get('provider') as AIProvider) || 'gemini';

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
      return NextResponse.json(
        { success: false, error: '이미지 파일을 선택해 주세요.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    if (mode === 'ai') {
      const validProviders: AIProvider[] = ['gemini', 'openai', 'claude', 'copilot'];
      const chosenProvider = validProviders.includes(provider) ? provider : 'gemini';
      try {
        const { data, source } = await runAIExtract(base64, mimeType, chosenProvider);
        console.log(`[extract-from-image] 추출된 JSON (${source}):`, JSON.stringify(data, null, 2));
        return NextResponse.json({ success: true, data, source });
      } catch (aiErr) {
        const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
        if (/환경 변수.*설정해 주세요/.test(msg)) {
          return NextResponse.json({ success: false, error: msg }, { status: 400 });
        }
        if (isQuotaOrRateLimitError(aiErr)) {
          const data = sanitizeExtractedData(await runTesseract(imageBuffer));
          console.log('[extract-from-image] 추출된 JSON (tesseract fallback):', JSON.stringify(data, null, 2));
          return NextResponse.json({ success: true, data, source: 'tesseract' });
        }
        throw aiErr;
      }
    }

    const data = sanitizeExtractedData(await runTesseract(imageBuffer));
    console.log('[extract-from-image] 추출된 JSON (tesseract):', JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data, source: 'tesseract' });
  } catch (err) {
    console.error('extract-from-image error:', err);
    const message = err instanceof Error ? err.message : '이미지에서 항목 추출에 실패했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
