"""
Page-level Upstash Search indexer.

Reads Markdown/MDX content files from src/content/, extracts frontmatter
and body text, and upserts one document per page into the Upstash Search
index. Replaces the crawler-based approach that created per-section chunks.

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
  body_text: str
  collection: str


def load_environment() -> None:
  repo_root = Path(__file__).resolve().parents[1]
  env_path = repo_root / ".env.development"
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
      body_text = extract_plain_text(body)

      pages.append(PageDocument(
        id=url_path,
        path=url_path,
        title=title,
        description=description,
        body_text=body_text,
        collection=config.name,
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


def upsert_pages(
  *,
  upstash_url: str,
  upstash_token: str,
  index_name: str,
  pages: list[PageDocument],
) -> int:
  """Upsert pages into Upstash Search. Returns count of documents upserted."""
  client = Search(url=upstash_url, token=upstash_token)
  index = client.index(index_name)

  total = 0
  for i in range(0, len(pages), UPSERT_BATCH_SIZE):
    batch = pages[i:i + UPSERT_BATCH_SIZE]
    documents = [
      {
        "id": page.id,
        "content": {
          "title": page.title,
          "description": page.description,
          "fullContent": page.body_text,
        },
        "metadata": {
          "path": page.path,
          "collection": page.collection,
        },
      }
      for page in batch
    ]
    index.upsert(documents)
    total += len(batch)
    print(f"[search:reindex] Upserted batch {i // UPSERT_BATCH_SIZE + 1} ({total}/{len(pages)} pages)")

  return total


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
  parser = argparse.ArgumentParser(description="Page-level Upstash Search indexer.")
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
  print(f"[search:reindex] Discovered {len(pages)} pages across {len(set(p.collection for p in pages))} collection(s).")

  if args.dry_run:
    for page in pages:
      print(f"  {page.collection:<15} {page.path:<80} {page.title}")
    print(f"\n[search:reindex] Dry run complete. {len(pages)} pages would be indexed.")
    return 0

  try:
    if not args.no_drop:
      drop_index(upstash_url=upstash_url, upstash_token=upstash_token, index_name=index_name)

    count = upsert_pages(
      upstash_url=upstash_url,
      upstash_token=upstash_token,
      index_name=index_name,
      pages=pages,
    )
    print(f"[search:reindex] Done. Indexed {count} pages into '{index_name}'.")
    return 0
  except Exception as exc:  # noqa: BLE001
    print(f"[search:reindex] {exc}", file=sys.stderr)
    return 1


if __name__ == "__main__":
  raise SystemExit(main())
