import { EMBEDDING_MODEL } from '~/lib/search/constants';

type EmbeddingOutput = {
  shape?: number[];
  data?: number[][];
};

export async function embedTexts(ai: Ai, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const result = (await ai.run(EMBEDDING_MODEL, {
    text: texts,
    truncate_inputs: true,
  })) as EmbeddingOutput;
  const vectors = result.data;
  if (!vectors || vectors.length !== texts.length) {
    throw new Error('Embedding model returned unexpected shape');
  }
  return vectors;
}

export async function embedQuery(ai: Ai, query: string): Promise<number[]> {
  const [vector] = await embedTexts(ai, [query]);
  if (!vector) throw new Error('Empty query embedding');
  return vector;
}
