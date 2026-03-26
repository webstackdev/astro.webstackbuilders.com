"""Report indexed section chunks that exceed Upstash Search limits.

This script imports page discovery and section chunking from
scripts/search-index.py so content selection, Markdown/MDX-to-plain-text
extraction, and chunk sizing stay in sync with the actual indexer.
"""
from __future__ import annotations

import argparse
import importlib.util
import sys
from dataclasses import dataclass
from pathlib import Path
from types import ModuleType
from typing import Final


CONTENT_LENGTH_LIMIT: Final[int] = 4096
SEARCH_INDEX_SCRIPT: Final[Path] = Path(__file__).with_name("search-index.py")


@dataclass(slots=True, frozen=True)
class OversizedContentRow:
  content_path: str
  char_length: int


def load_search_index_module() -> ModuleType:
  spec = importlib.util.spec_from_file_location("search_index_script", SEARCH_INDEX_SCRIPT)
  if spec is None or spec.loader is None:
    raise ImportError(f"Could not load search index script from {SEARCH_INDEX_SCRIPT}")

  module = importlib.util.module_from_spec(spec)
  sys.modules[spec.name] = module
  spec.loader.exec_module(module)
  return module


def collect_oversized_content_rows(
  *,
  collections: list[str] | None = None,
  limit: int = CONTENT_LENGTH_LIMIT,
) -> list[OversizedContentRow]:
  search_index = load_search_index_module()
  pages = search_index.discover_pages(collections)

  rows: list[OversizedContentRow] = []
  for page in pages:
    chunks = search_index.chunk_page(page)
    for chunk in chunks:
      total = len(chunk.title) + len(chunk.section_heading) + len(chunk.section_content)
      if total > limit:
        rows.append(OversizedContentRow(
          content_path=f"{chunk.source_path} [{chunk.id}]",
          char_length=total,
        ))
  return sorted(rows, key=lambda row: (-row.char_length, row.content_path))


def format_oversized_content_table(rows: list[OversizedContentRow]) -> str:
  if not rows:
    return "No indexed chunks exceed the content limit."

  path_header = "Content Path"
  length_header = "Character Length"
  path_width = max(len(path_header), *(len(row.content_path) for row in rows))
  length_width = max(len(length_header), *(len(str(row.char_length)) for row in rows))

  header = f"{path_header:<{path_width}}  {length_header:>{length_width}}"
  separator = f"{'-' * path_width}  {'-' * length_width}"
  lines = [header, separator]
  lines.extend(f"{row.content_path:<{path_width}}  {row.char_length:>{length_width}}" for row in rows)
  return "\n".join(lines)


def main() -> int:
  parser = argparse.ArgumentParser(description="Report indexed section chunks over the Upstash character limit.")
  parser.add_argument("--collection", action="append", dest="collections", help="Only inspect specific collection(s). Can be repeated.")
  parser.add_argument("--limit", type=int, default=CONTENT_LENGTH_LIMIT, help=f"Maximum allowed character length. Defaults to {CONTENT_LENGTH_LIMIT}.")
  args = parser.parse_args()

  try:
    rows = collect_oversized_content_rows(collections=args.collections, limit=args.limit)
  except Exception as exc:  # noqa: BLE001
    print(f"[search:content-length] {exc}", file=sys.stderr)
    return 1

  print(format_oversized_content_table(rows))

  if rows:
    print(f"\nFound {len(rows)} chunk(s) over {args.limit} characters.")
  else:
    print(f"\nAll indexed chunks are within the {args.limit}-character limit.")

  return 0


if __name__ == "__main__":
  raise SystemExit(main())