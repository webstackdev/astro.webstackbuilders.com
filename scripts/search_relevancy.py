from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Final

from dotenv import load_dotenv
from upstash_search import Search


DEFAULT_INDEX_NAME: Final[str] = 'default'
DEFAULT_LIMIT: Final[int] = 10


@dataclass(slots=True)
class SearchRelevancyRow:
  title: str
  path: str
  score: float


def load_environment() -> None:
  repo_root = Path(__file__).resolve().parents[1]
  env_path = repo_root / '.env.development'
  if not env_path.exists():
    raise ValueError('Missing .env.development. Create it locally before using this script.')

  load_dotenv(dotenv_path=env_path)


def resolve_upstash_credentials() -> tuple[str, str, str]:
  index_name = (os.environ.get('UPSTASH_SEARCH_INDEX_NAME') or '').strip() or DEFAULT_INDEX_NAME

  url = (
    (os.environ.get('UPSTASH_SEARCH_REST_URL') or '').strip()
    or (os.environ.get('PUBLIC_UPSTASH_SEARCH_REST_URL') or '').strip()
  )

  token = (
    (os.environ.get('PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN') or '').strip()
    or (os.environ.get('UPSTASH_SEARCH_REST_TOKEN') or '').strip()
    or (os.environ.get('UPSTASH_SEARCH_WRITE_TOKEN') or '').strip()
    or (os.environ.get('UPSTASH_SEARCH_REST_WRITE_TOKEN') or '').strip()
  )

  if not url:
    raise ValueError('Missing UPSTASH_SEARCH_REST_URL or PUBLIC_UPSTASH_SEARCH_REST_URL')
  if not token:
    raise ValueError('Missing a usable Upstash Search token')

  return url, token, index_name


def get_value(source: Any, key: str) -> Any:
  if isinstance(source, dict):
    return source.get(key)
  return getattr(source, key, None)


def get_result_title(result: Any) -> str:
  content = get_value(result, 'content') or {}
  title = get_value(content, 'title') or get_value(content, 'name') or get_value(result, 'id')
  if isinstance(title, str) and title.strip():
    return title.strip()
  return '(untitled result)'


def get_result_path(result: Any) -> str:
  content = get_value(result, 'content') or {}
  metadata = get_value(result, 'metadata') or {}
  path = (
    get_value(metadata, 'path')
    or get_value(metadata, 'url')
    or get_value(content, 'path')
    or get_value(content, 'url')
  )

  if isinstance(path, str) and path.strip():
    return path.strip()

  return '(no path)'


def collect_search_relevancy_rows(results: list[Any]) -> list[SearchRelevancyRow]:
  rows: list[SearchRelevancyRow] = []

  for result in results:
    raw_score = get_value(result, 'score')
    if not isinstance(raw_score, int | float):
      continue

    rows.append(
      SearchRelevancyRow(
        title=get_result_title(result),
        path=get_result_path(result),
        score=float(raw_score),
      )
    )

  return rows


def format_score(score: float) -> str:
  return f'{score:.6f}'.rstrip('0').rstrip('.')


def format_results_table(rows: list[SearchRelevancyRow], *, show_path: bool = True) -> str:
  title_header = 'Result Title'
  path_header = 'Path'
  score_header = 'Relevancy Score'

  title_width = max([len(title_header), *(len(row.title) for row in rows)])
  path_width = max([len(path_header), *(len(row.path) for row in rows)]) if show_path else 0
  score_values = [format_score(row.score) for row in rows]
  score_width = max([len(score_header), *(len(value) for value in score_values)])

  if show_path:
    separator = f'+-{'-' * title_width}-+-{'-' * path_width}-+-{'-' * score_width}-+'
    header = (
      f'| {title_header.ljust(title_width)} | '
      f'{path_header.ljust(path_width)} | '
      f'{score_header.rjust(score_width)} |'
    )
    body = [
      f'| {row.title.ljust(title_width)} | {row.path.ljust(path_width)} | {format_score(row.score).rjust(score_width)} |'
      for row in rows
    ]
    return '\n'.join([separator, header, separator, *body, separator])

  separator = f'+-{'-' * title_width}-+-{'-' * score_width}-+'
  header = f'| {title_header.ljust(title_width)} | {score_header.rjust(score_width)} |'
  body = [f'| {row.title.ljust(title_width)} | {format_score(row.score).rjust(score_width)} |' for row in rows]

  return '\n'.join([separator, header, separator, *body, separator])


def run_search(*, query: str, limit: int, index_name: str | None = None, reranking: bool = False) -> list[SearchRelevancyRow]:
  url, token, default_index_name = resolve_upstash_credentials()
  client = Search(url=url, token=token)
  raw_results = client.index(index_name or default_index_name).search(
    query,
    limit=limit,
    reranking=reranking,
    semantic_weight=0.5,
  )
  return collect_search_relevancy_rows(raw_results)


def parse_args(argv: list[str]) -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description='Query Upstash Search and print article relevancy scores in a table.'
  )
  parser.add_argument('query', help='Search query. Wrap multi-word queries in quotes.')
  parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT, help='Maximum Upstash results to request.')
  parser.add_argument('--index-name', default=None, help='Override the Upstash index name.')
  parser.add_argument('--reranking', action='store_true', help='Enable Upstash reranking for the query.')
  parser.add_argument('--hide-path', action='store_true', help='Hide the path column from the output table.')
  return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
  args = parse_args(argv or sys.argv[1:])

  try:
    load_environment()
    rows = run_search(query=args.query, limit=args.limit, index_name=args.index_name, reranking=args.reranking)
  except Exception as exc:  # noqa: BLE001
    print(f'[search:relevancy] {exc}', file=sys.stderr)
    return 1

  if not rows:
    print(f'No results found for query: {args.query}')
    return 0

  print(format_results_table(rows, show_path=not args.hide_path))
  return 0


if __name__ == '__main__':
  raise SystemExit(main())