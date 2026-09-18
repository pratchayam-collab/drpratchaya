import { GENERATION_MODEL, BOOK_PATH } from '~/lib/search/constants';
import {
  assessAskGrounding,
  isVerbatimSubstring,
  normalizeForMatch,
} from '~/lib/search/grounding';
import type { AskCitation, AskResponseBody, SearchHit, VectorChunkMetadata } from '~/lib/search/types';
import { canonicalUrl } from '~/utils/site-url';

const REFUSAL_TH =
  'เว็บไซต์นี้ยังไม่มีข้อมูลจากบทความของนพ.ปรัชญา มานพที่ตอบคำถามนี้ได้อย่างชัดเจน กรุณานัดปรึกษาแพทย์เพื่อรับคำแนะนำที่เหมาะกับอาการของคุณ';

interface LlmAskJson {
  answer?: string;
  citations?: { slug?: string; quote?: string }[];
}

function buildContextBlock(chunks: VectorChunkMetadata[]): string {
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] slug=${c.slug} title=${c.title}\n${c.text}`,
    )
    .join('\n\n---\n\n');
}

function extractiveAnswer(chunk: VectorChunkMetadata): { answer: string; citation: AskCitation } {
  const quote =
    chunk.kind === 'faq'
      ? chunk.text.replace(/^คำถาม:\s*/m, '').trim()
      : chunk.text.trim();
  const answer =
    chunk.kind === 'faq'
      ? quote.split('\nคำตอบ:').slice(1).join('\nคำตอบ:').trim() || quote
      : quote;
  return {
    answer,
    citation: {
      slug: chunk.slug,
      title: chunk.title,
      path: chunk.path,
      url: canonicalUrl(chunk.path),
      quote: chunk.text.length > 400 ? `${chunk.text.slice(0, 397)}…` : chunk.text,
    },
  };
}

function refusalBody(): AskResponseBody {
  return {
    ok: true,
    outcome: 'refused',
    message: REFUSAL_TH,
    bookPath: BOOK_PATH,
  };
}

export async function composeAskResponse(
  ai: Ai,
  question: string,
  hits: SearchHit[],
  chunks: VectorChunkMetadata[],
): Promise<AskResponseBody> {
  const grounding = assessAskGrounding(hits, question, chunks);
  if (!grounding.grounded || chunks.length === 0) {
    return refusalBody();
  }

  const context = buildContextBlock(chunks);
  const system = `You are a formatting assistant for a Thai orthopaedic surgeon's website.
You MUST follow these rules without exception:
1. Use ONLY facts explicitly stated in the PASSAGES. Never use outside medical knowledge.
2. If the passages do not fully answer the question, respond with exactly: {"refuse":true}
3. Never diagnose, recommend treatment, or give probabilities not present in the passages.
4. Output valid JSON only, no markdown: {"answer":"...","citations":[{"slug":"...","quote":"..."}]}
5. Each quote in citations MUST be copied verbatim from a passage (continuous substring).
6. answer must be Thai unless the user question was entirely in English; then answer in English.
7. Do not add disclaimers beyond what is in the passages.`;

  const user = `QUESTION:\n${question}\n\nPASSAGES:\n${context}\n\nRespond in JSON.`;

  let parsed: LlmAskJson | { refuse: true } | null = null;
  try {
    const raw = await ai.run(GENERATION_MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 512,
      temperature: 0,
    });
    const text =
      typeof raw === 'string'
        ? raw
        : typeof raw === 'object' && raw !== null && 'response' in raw
          ? String((raw as { response?: string }).response ?? '')
          : JSON.stringify(raw);
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as LlmAskJson | { refuse: true };
    }
  } catch {
    parsed = null;
  }

  if (parsed && 'refuse' in parsed && parsed.refuse) {
    return refusalBody();
  }

  const llm = parsed as LlmAskJson | null;
  if (llm?.answer && llm.citations?.length) {
    const citations: AskCitation[] = [];
    for (const cite of llm.citations) {
      const slug = cite.slug?.trim();
      const quote = cite.quote?.trim();
      if (!slug || !quote) continue;
      const source = chunks.find((c) => c.slug === slug);
      if (!source || !isVerbatimSubstring(quote, source.text)) continue;
      citations.push({
        slug: source.slug,
        title: source.title,
        path: source.path,
        url: canonicalUrl(source.path),
        quote,
      });
    }
    if (citations.length > 0 && normalizeForMatch(llm.answer).length > 0) {
      return {
        ok: true,
        outcome: 'answered',
        answer: llm.answer.trim(),
        citations,
        bookPath: BOOK_PATH,
      };
    }
  }

  const best = chunks[0];
  if (!best) return refusalBody();
  const extractive = extractiveAnswer(best);
  return {
    ok: true,
    outcome: 'answered',
    answer: extractive.answer,
    citations: [extractive.citation],
    bookPath: BOOK_PATH,
  };
}
