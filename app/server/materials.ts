import "server-only";

import type { Row } from "postgres";
import { getDb } from "./db";

/** 한 조각의 크기. 너무 크면 답에 관련 없는 내용이 섞이고, 너무 작으면 문맥이 끊긴다. */
const CHUNK_CHARS = 900;
const CHUNK_OVERLAP = 120;

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type MaterialKind = "PDF" | "필기" | "링크";

/** 페이지 텍스트를 겹치는 조각으로 나눈다. 겹치는 부분이 문장 잘림을 완화한다. */
function chunkPage(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length === 0) return [];
  if (clean.length <= CHUNK_CHARS) return [clean];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    chunks.push(clean.slice(start, start + CHUNK_CHARS));
    start += CHUNK_CHARS - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function extractPdfPages(bytes: Uint8Array): Promise<string[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return Array.isArray(text) ? text : [String(text)];
}

export async function storeMaterial(
  workspaceId: string,
  input: {
    title: string;
    kind: MaterialKind;
    mimeType: string;
    byteSize: number;
    pages: string[];
  },
) {
  const sql = getDb();
  const pageCount = input.pages.length;
  const extent =
    input.kind === "PDF" ? `${pageCount}쪽` : input.kind === "링크" ? "링크" : `${pageCount}장`;

  const [material] = await sql<Array<Row & { id: string }>>`
    insert into materials (
      workspace_id, kind, title, extent, page_count, byte_size, mime_type
    ) values (
      ${workspaceId}, ${input.kind}, ${input.title}, ${extent},
      ${pageCount}, ${input.byteSize}, ${input.mimeType}
    )
    returning id
  `;

  let position = 0;
  const rows: { material_id: string; page: number; position: number; content: string }[] = [];
  input.pages.forEach((pageText, index) => {
    for (const chunk of chunkPage(pageText)) {
      rows.push({
        material_id: material.id,
        page: index + 1,
        position: position++,
        content: chunk,
      });
    }
  });

  if (rows.length > 0) {
    await sql`insert into material_chunks ${sql(rows, "material_id", "page", "position", "content")}`;
  }

  return { id: material.id, chunks: rows.length, pageCount };
}

export type MaterialHit = {
  title: string;
  page: number | null;
  excerpt: string;
};

/**
 * 자료 본문에서 관련 조각을 찾는다.
 * 한국어라 형태소 분석 없이는 tsvector 가 잘 듣지 않아, 검색어를 낱말로 쪼개
 * 몇 개나 겹치는지로 순위를 매긴다.
 */
export async function searchMaterialChunks(
  workspaceId: string,
  query: string,
  limit = 4,
): Promise<MaterialHit[]> {
  const sql = getDb();
  const words = Array.from(
    new Set(
      query
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 2),
    ),
  ).slice(0, 8);

  if (words.length === 0) return [];

  const rows = await sql<
    Array<Row & { title: string; page: number | null; content: string; hits: number }>
  >`
    select m.title, c.page, c.content,
           (select count(*) from unnest(${words}::text[]) w
             where c.content ilike '%' || w || '%') as hits
    from material_chunks c
    join materials m on m.id = c.material_id
    where m.workspace_id = ${workspaceId}
      and c.content ilike any (${words.map((w) => `%${w}%`)}::text[])
    order by hits desc, c.position
    limit ${limit}
  `;

  if (rows.length > 0) {
    await sql`
      update materials set used_count = used_count + 1
      where workspace_id = ${workspaceId}
        and title in ${sql(Array.from(new Set(rows.map((row) => row.title))))}
    `;
  }

  return rows.map((row) => ({
    title: row.title,
    page: row.page,
    excerpt: row.content,
  }));
}
