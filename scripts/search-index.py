"""
Section-chunked Upstash Search indexer.

Reads Markdown/MDX content files from src/content/, splits each page into
h2-level sections, and upserts one document per section chunk into the
Upstash Search index.  Each chunk stays within the 4 096-character content
limit.  At query time the responder deduplicates chunks that share the same
canonical page path, returning one hit per page.

Usage:
  python3 scripts/search-index.py                  # full reindex (drop + upsert)
  python3 scripts/search-index.py --no-drop        # upsert only (incremental)
  python3 scripts/search-index.py --dry-run        # preview without writing
  python3 scripts/search-index.py --collection articles  # single collection
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Final

import yaml
from dotenv import load_dotenv
from upstash_search import Search


DEFAULT_INDEX_NAME: Final[str] = "default"

REPO_ROOT: Final[Path] = Path(__file__).resolve().parents[1]
CONTENT_ROOT: Final[Path] = Path(__file__).resolve().parents[1] / "src" / "content"


@dataclass(slots=True, frozen=True)
class CollectionConfig:
  name: str
  url_prefix: str
  source_dir: str
  glob_pattern: str


# Collections to index
COLLECTIONS: Final[list[CollectionConfig]] = [
  CollectionConfig(name="articles", url_prefix="/articles", source_dir="articles", glob_pattern="**/index.mdx"),
  CollectionConfig(name="deep-dive", url_prefix="/deep-dive", source_dir="articles", glob_pattern="**/pdf.mdx"),
  CollectionConfig(name="case-studies", url_prefix="/case-studies", source_dir="case-studies", glob_pattern="**/index.mdx"),
  CollectionConfig(name="services", url_prefix="/services", source_dir="services", glob_pattern="**/index.md"),
]

COLLECTION_NAMES: Final[list[str]] = [c.name for c in COLLECTIONS]


@dataclass(slots=True, frozen=True)
class PageDocument:
  id: str
  path: str
  title: str
  description: str
  raw_body: str
  collection: str
  source_path: str


@dataclass(slots=True, frozen=True)
class ChunkDocument:
  id: str
  path: str
  title: str
  section_heading: str
  section_content: str
  collection: str
  source_path: str


CHUNK_CONTENT_LIMIT: Final[int] = 4096
CONTENT_OVERHEAD: Final[int] = 150


def load_environment() -> None:
  env_path = REPO_ROOT / ".env.development"
  if not env_path.exists():
    raise ValueError("Missing .env.development. Use `npm run dev:env` to run with it, or create the file locally.")
  load_dotenv(dotenv_path=env_path)


def resolve_upstash_credentials() -> tuple[str, str, str]:
  index_name = (os.environ.get("UPSTASH_SEARCH_INDEX_NAME") or "").strip() or DEFAULT_INDEX_NAME

  url = (
    (os.environ.get("UPSTASH_SEARCH_REST_URL") or "").strip()
    or (os.environ.get("PUBLIC_UPSTASH_SEARCH_REST_URL") or "").strip()
  )

  token = (
    (os.environ.get("UPSTASH_SEARCH_REST_TOKEN") or "").strip()
    or (os.environ.get("UPSTASH_SEARCH_WRITE_TOKEN") or "").strip()
    or (os.environ.get("UPSTASH_SEARCH_REST_WRITE_TOKEN") or "").strip()
  )

  if not url:
    raise ValueError("Missing UPSTASH_SEARCH_REST_URL (or PUBLIC_UPSTASH_SEARCH_REST_URL)")
  if not token:
    raise ValueError("Missing UPSTASH_SEARCH_REST_TOKEN (write token required for indexing)")

  return url, token, index_name


# ---------------------------------------------------------------------------
# Frontmatter + body extraction
# ---------------------------------------------------------------------------

FRONTMATTER_RE: Final[re.Pattern[str]] = re.compile(
  r"\A---\s*\n(.*?)\n---\s*\n",
  re.DOTALL,
)


def parse_frontmatter(raw: str) -> tuple[dict[str, object], str]:
  """Return (frontmatter_dict, body_text) from a Markdown/MDX file."""
  match = FRONTMATTER_RE.match(raw)
  if not match:
    return {}, raw

  fm_yaml = match.group(1)
  body = raw[match.end():]
  try:
    fm = yaml.safe_load(fm_yaml)
  except yaml.YAMLError:
    fm = {}

  return (fm if isinstance(fm, dict) else {}), body


# MDX/Markdown cleanup patterns
MDX_IMPORT_RE: Final[re.Pattern[str]] = re.compile(r"^import\s+.*$", re.MULTILINE)
MDX_COMPONENT_RE: Final[re.Pattern[str]] = re.compile(r"</?[A-Z][A-Za-z0-9]*[^>]*>")
ABBR_RE: Final[re.Pattern[str]] = re.compile(r"^\*\[[^\]]+\]:.*$", re.MULTILINE)
HEADING_RE: Final[re.Pattern[str]] = re.compile(r"^#+\s+", re.MULTILINE)
LINK_RE: Final[re.Pattern[str]] = re.compile(r"\[([^\]]*)\]\([^)]*\)")
IMAGE_RE: Final[re.Pattern[str]] = re.compile(r"!\[([^\]]*)\]\([^)]*\)")
FOOTNOTE_REF_RE: Final[re.Pattern[str]] = re.compile(r"\[\^[^\]]+\]")
FOOTNOTE_DEF_RE: Final[re.Pattern[str]] = re.compile(r"^\[\^[^\]]+\]:.*$", re.MULTILINE)
HTML_TAG_RE: Final[re.Pattern[str]] = re.compile(r"<[^>]+>")
CODE_BLOCK_RE: Final[re.Pattern[str]] = re.compile(r"```[\s\S]*?```")
INLINE_CODE_RE: Final[re.Pattern[str]] = re.compile(r"`[^`]+`")
BOLD_ITALIC_RE: Final[re.Pattern[str]] = re.compile(r"[*_]{1,3}([^*_]+)[*_]{1,3}")
MULTI_NEWLINE_RE: Final[re.Pattern[str]] = re.compile(r"\n{3,}")
MULTI_SPACE_RE: Final[re.Pattern[str]] = re.compile(r"[ \t]{2,}")


def extract_plain_text(body: str) -> str:
  """Strip Markdown/MDX syntax to plain searchable text."""
  text = body
  text = CODE_BLOCK_RE.sub("", text)
  text = MDX_IMPORT_RE.sub("", text)
  text = MDX_COMPONENT_RE.sub("", text)
  text = ABBR_RE.sub("", text)
  text = FOOTNOTE_DEF_RE.sub("", text)
  text = FOOTNOTE_REF_RE.sub("", text)
  text = IMAGE_RE.sub(r"\1", text)
  text = LINK_RE.sub(r"\1", text)
  text = HTML_TAG_RE.sub("", text)
  text = HEADING_RE.sub("", text)
  text = INLINE_CODE_RE.sub(lambda m: m.group(0)[1:-1], text)
  text = BOLD_ITALIC_RE.sub(r"\1", text)
  text = MULTI_NEWLINE_RE.sub("\n\n", text)
  text = MULTI_SPACE_RE.sub(" ", text)
  return text.strip()


# ---------------------------------------------------------------------------
# Section chunking
# ---------------------------------------------------------------------------

SECTION_SPLIT_RE: Final[re.Pattern[str]] = re.compile(
  r"^(#{2}\s+.+)$", re.MULTILINE,
)


def split_into_sections(raw_body: str) -> list[tuple[str, str]]:
  """Split raw markdown into (heading, body) pairs by h2 headings."""
  parts = SECTION_SPLIT_RE.split(raw_body)
  sections: list[tuple[str, str]] = []

  intro = parts[0].strip()
  if intro:
    sections.append(("", intro))

  for i in range(1, len(parts), 2):
    heading = parts[i].lstrip("#").strip()
    body = parts[i + 1].strip() if i + 1 < len(parts) else ""
    if body:
      sections.append((heading, body))

  if not sections and raw_body.strip():
    sections.append(("", raw_body.strip()))

  return sections


def chunk_text(text: str, budget: int) -> list[str]:
  """Split text into pieces that each fit within the character budget."""
  if len(text) <= budget:
    return [text]

  chunks: list[str] = []
  paragraphs = text.split("\n\n")
  current = ""

  for para in paragraphs:
    candidate = f"{current}\n\n{para}" if current else para
    if len(candidate) <= budget:
      current = candidate
    else:
      if current:
        chunks.append(current)
      if len(para) > budget:
        for start in range(0, len(para), budget):
          chunks.append(para[start:start + budget])
        current = ""
      else:
        current = para

  if current:
    chunks.append(current)

  return chunks


def chunk_page(page: PageDocument) -> list[ChunkDocument]:
  """Split a page into section-level chunks that fit Upstash's character limit."""
  sections = split_into_sections(page.raw_body)
  chunks: list[ChunkDocument] = []

  for heading, raw_section_body in sections:
    section_text = extract_plain_text(raw_section_body)
    if not section_text:
      continue

    overhead = len(page.title) + len(heading) + CONTENT_OVERHEAD
    budget = max(CHUNK_CONTENT_LIMIT - overhead, 500)
    text_parts = chunk_text(section_text, budget)

    for text_part in text_parts:
      chunk_idx = len(chunks)
      chunks.append(ChunkDocument(
        id=f"{page.path}#chunk-{chunk_idx}",
        path=page.path,
        title=page.title,
        section_heading=heading,
        section_content=text_part,
        collection=page.collection,
        source_path=page.source_path,
      ))

  if not chunks and page.description:
    chunks.append(ChunkDocument(
      id=f"{page.path}#chunk-0",
      path=page.path,
      title=page.title,
      section_heading="",
      section_content=page.description,
      collection=page.collection,
      source_path=page.source_path,
    ))

  return chunks


def chunk_pages(pages: list[PageDocument]) -> list[ChunkDocument]:
  """Chunk all pages into section-level documents."""
  chunks: list[ChunkDocument] = []
  for page in pages:
    chunks.extend(chunk_page(page))
  return chunks


# ---------------------------------------------------------------------------
# Content discovery
# ---------------------------------------------------------------------------

def slug_from_path(content_file: Path, collection_dir: Path) -> str:
  """Derive the URL slug from a content file path."""
  relative = content_file.relative_to(collection_dir)
  parent = relative.parent
  return str(parent) if str(parent) != "." else relative.stem


def discover_pages(collections: list[str] | None = None) -> list[PageDocument]:
  """Walk content directories and build PageDocument list."""
  target_names = collections or COLLECTION_NAMES
  configs = [c for c in COLLECTIONS if c.name in target_names]

  unknown = set(target_names) - {c.name for c in configs}
  for name in sorted(unknown):
    print(f"[search:reindex] Warning: unknown collection '{name}', skipping.")

  pages: list[PageDocument] = []

  for config in configs:
    collection_dir = CONTENT_ROOT / config.source_dir

    if not collection_dir.is_dir():
      print(f"[search:reindex] Warning: directory not found: {collection_dir}")
      continue

    for content_file in sorted(collection_dir.glob(config.glob_pattern)):
      raw = content_file.read_text(encoding="utf-8")
      fm, body = parse_frontmatter(raw)

      if fm.get("isDraft"):
        continue

      title = str(fm.get("title") or "").strip()
      description = str(fm.get("description") or "").strip()

      if not title:
        print(f"[search:reindex] Warning: no title in {content_file}, skipping.")
        continue

      slug = slug_from_path(content_file, collection_dir)
      url_path = f"{config.url_prefix}/{slug}"

      pages.append(PageDocument(
        id=url_path,
        path=url_path,
        title=title,
        description=description,
        raw_body=body,
        collection=config.name,
        source_path=str(content_file.relative_to(REPO_ROOT)),
      ))

  return pages


# ---------------------------------------------------------------------------
# Upstash operations
# ---------------------------------------------------------------------------

def drop_index(*, upstash_url: str, upstash_token: str, index_name: str) -> None:
  client = Search(url=upstash_url, token=upstash_token)
  indexes = client.list_indexes()
  if index_name not in indexes:
    print(f"[search:reindex] Index '{index_name}' does not exist; nothing to drop.")
    return

  print(f"[search:reindex] Dropping index '{index_name}'...")
  client.delete_index(index_name)
  print(f"[search:reindex] Dropped index '{index_name}'.")


UPSERT_BATCH_SIZE: Final[int] = 50


def upsert_chunks(
  *,
  upstash_url: str,
  upstash_token: str,
  index_name: str,
  chunks: list[ChunkDocument],
) -> int:
  """Upsert section chunks into Upstash Search. Returns count of documents upserted."""
  client = Search(url=upstash_url, token=upstash_token)
  index = client.index(index_name)

  total = 0
  for i in range(0, len(chunks), UPSERT_BATCH_SIZE):
    batch = chunks[i:i + UPSERT_BATCH_SIZE]
    documents = [
      {
        "id": chunk.id,
        "content": {
          "title": chunk.title,
          "sectionHeading": chunk.section_heading,
          "sectionContent": chunk.section_content,
        },
        "metadata": {
          "path": chunk.path,
          "collection": chunk.collection,
        },
      }
      for chunk in batch
    ]
    index.upsert(documents)
    total += len(batch)
    print(f"[search:reindex] Upserted batch {i // UPSERT_BATCH_SIZE + 1} ({total}/{len(chunks)} chunks)")

  return total


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
  parser = argparse.ArgumentParser(description="Section-chunked Upstash Search indexer.")
  parser.add_argument("--no-drop", action="store_true", help="Skip dropping the index before upserting.")
  parser.add_argument("--dry-run", action="store_true", help="Discover pages and print summary without writing to Upstash.")
  parser.add_argument("--collection", action="append", dest="collections", help="Only index specific collection(s). Can be repeated.")
  args = parser.parse_args()

  try:
    load_environment()
    upstash_url, upstash_token, index_name = resolve_upstash_credentials()
  except Exception as exc:  # noqa: BLE001
    print(f"[search:reindex] {exc}", file=sys.stderr)
    return 1

  pages = discover_pages(args.collections)
  chunks = chunk_pages(pages)
  collections_count = len(set(p.collection for p in pages))
  print(f"[search:reindex] Discovered {len(pages)} pages \u2192 {len(chunks)} chunks across {collections_count} collection(s).")

  if args.dry_run:
    for page in pages:
      page_chunks = chunk_page(page)
      print(f"  {page.collection:<15} {page.path:<80} {len(page_chunks):>3} chunks  {page.title}")
    print(f"\n[search:reindex] Dry run complete. {len(pages)} pages \u2192 {len(chunks)} chunks would be indexed.")
    return 0

  try:
    if not args.no_drop:
      drop_index(upstash_url=upstash_url, upstash_token=upstash_token, index_name=index_name)

    count = upsert_chunks(
      upstash_url=upstash_url,
      upstash_token=upstash_token,
      index_name=index_name,
      chunks=chunks,
    )
    print(f"[search:reindex] Done. Indexed {count} chunks ({len(pages)} pages) into '{index_name}'.")
    return 0
  except Exception as exc:  # noqa: BLE001
    print(f"[search:reindex] {exc}", file=sys.stderr)
    return 1


if __name__ == "__main__":
  raise SystemExit(main())
