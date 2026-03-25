from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Final
from urllib.parse import urlparse

from dotenv import load_dotenv
from upstash_search import Search


DEFAULT_INDEX_NAME: Final[str] = 'default'
DEFAULT_LIMIT: Final[int] = 10


@dataclass(slots=True)
class ArticleRelevancyRow:
  path: str
  title: str
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


def normalize_path(value: Any) -> str:
  if not isinstance(value, str):
    return ''

  trimmed = value.strip()
  if not trimmed:
    return ''

  if trimmed.startswith('http://') or trimmed.startswith('https://'):
    parsed = urlparse(trimmed)
    path = parsed.path or ''
    suffix = ''
    if parsed.query:
      suffix = f'?{parsed.query}'
    if parsed.fragment:
      suffix = f'{suffix}#{parsed.fragment}'
    return f'{path}{suffix}'

  return trimmed


def get_base_article_path(path: str) -> str:
  without_query = path.split('?', 1)[0]
  without_fragment = without_query.split('#', 1)[0]
  return without_fragment.rstrip('/')


def is_article_path(path: str) -> bool:
  return path.startswith('/articles/') and len(path.split('/')) >= 3


def slug_to_title(slug: str) -> str:
  words = [word for word in slug.replace('_', '-').split('-') if word]
  return ' '.join(word.capitalize() for word in words)


def get_article_title(result: Any, article_path: str) -> str:
  content = get_value(result, 'content') or {}
  title = get_value(content, 'title')
  if isinstance(title, str) and title.strip():
    result_path = normalize_path(
      get_value(get_value(result, 'metadata') or {}, 'path')
      or get_value(get_value(result, 'metadata') or {}, 'url')
      or get_value(content, 'path')
      or get_value(content, 'url')
    )
    if '#' not in result_path:
      return title.strip()

  slug = article_path.rsplit('/', 1)[-1]
  return slug_to_title(slug)


def collect_article_relevancy_rows(results: list[Any]) -> list[ArticleRelevancyRow]:
  grouped: dict[str, ArticleRelevancyRow] = {}

  for result in results:
    metadata = get_value(result, 'metadata') or {}
    content = get_value(result, 'content') or {}
    path = normalize_path(
      get_value(metadata, 'path')
      or get_value(metadata, 'url')
      or get_value(content, 'path')
      or get_value(content, 'url')
    )

    article_path = get_base_article_path(path)
    if not is_article_path(article_path):
      continue

    raw_score = get_value(result, 'score')
    if not isinstance(raw_score, int | float):
      continue

    candidate = ArticleRelevancyRow(
      path=article_path,
      title=get_article_title(result, article_path),
      score=float(raw_score),
    )

    existing = grouped.get(article_path)
    if existing is None:
      grouped[article_path] = candidate
      continue

    if candidate.score > existing.score:
      title = existing.title
      if '#' not in path and candidate.title.strip():
        title = candidate.title
      grouped[article_path] = ArticleRelevancyRow(path=article_path, title=title, score=candidate.score)
      continue

    if '#' not in path and candidate.title.strip() and existing.title == slug_to_title(article_path.rsplit('/', 1)[-1]):
      grouped[article_path] = ArticleRelevancyRow(path=article_path, title=candidate.title, score=existing.score)

  return sorted(grouped.values(), key=lambda row: row.score, reverse=True)


def format_score(score: float) -> str:
  return f'{score:.6f}'.rstrip('0').rstrip('.')


def format_results_table(rows: list[ArticleRelevancyRow]) -> str:
  title_header = 'Article Title'
  score_header = 'Relevancy Score'

  title_width = max([len(title_header), *(len(row.title) for row in rows)])
  score_values = [format_score(row.score) for row in rows]
  score_width = max([len(score_header), *(len(value) for value in score_values)])

  separator = f'+-{'-' * title_width}-+-{'-' * score_width}-+'
  header = f'| {title_header.ljust(title_width)} | {score_header.rjust(score_width)} |'

  body = [
    f'| {row.title.ljust(title_width)} | {format_score(row.score).rjust(score_width)} |'
    for row in rows
  ]

  return '\n'.join([separator, header, separator, *body, separator])


def run_search(*, query: str, limit: int, index_name: str | None = None) -> list[ArticleRelevancyRow]:
  url, token, default_index_name = resolve_upstash_credentials()
  client = Search(url=url, token=token)
  raw_results = client.index(index_name or default_index_name).search(query, limit=limit, reranking=True)
  return collect_article_relevancy_rows(raw_results)


def parse_args(argv: list[str]) -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description='Query Upstash Search and print article relevancy scores in a table.'
  )
  parser.add_argument('query', help='Search query. Wrap multi-word queries in quotes.')
  parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT, help='Maximum Upstash results to request.')
  parser.add_argument('--index-name', default=None, help='Override the Upstash index name.')
  return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
  args = parse_args(argv or sys.argv[1:])

  try:
    load_environment()
    rows = run_search(query=args.query, limit=args.limit, index_name=args.index_name)
  except Exception as exc:  # noqa: BLE001
    print(f'[search:relevancy] {exc}', file=sys.stderr)
    return 1

  if not rows:
    print(f'No article results found for query: {args.query}')
    return 0

  print(format_results_table(rows))
  return 0


if __name__ == '__main__':
  raise SystemExit(main())