from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Final

from dotenv import load_dotenv
from upstash_search import Search


DEFAULT_INDEX_NAME: Final[str] = "default"
DEFAULT_SITE_ORIGIN: Final[str] = "https://www.webstackbuilders.com"


def get_required_env(name: str) -> str:
	value = (os.environ.get(name) or "").strip()
	if not value:
		raise ValueError(f"Missing required environment variable: {name}")
	return value


def normalize_origin(origin: str) -> str:
	trimmed = origin.strip()
	if not trimmed:
		raise ValueError("SEARCH_DOC_ORIGIN is empty")
	return trimmed[:-1] if trimmed.endswith("/") else trimmed


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
		raise ValueError("Missing UPSTASH_SEARCH_REST_TOKEN (write token required for drop + reindex)")

	return url, token, index_name


def drop_index(*, upstash_url: str, upstash_token: str, index_name: str) -> None:
	client = Search(url=upstash_url, token=upstash_token)
	indexes = client.list_indexes()
	if index_name not in indexes:
		print(f"[search:reindex] Index '{index_name}' does not exist; nothing to drop.")
		return

	print(f"[search:reindex] Dropping index '{index_name}'...")
	client.delete_index(index_name)
	print(f"[search:reindex] Dropped index '{index_name}'.")


def crawl_doc_url(*, upstash_url: str, upstash_token: str, index_name: str, doc_url: str) -> None:
	command = [
		"npx",
		"-y",
		"@upstash/search-crawler",
		"--upstash-url",
		upstash_url,
		"--upstash-token",
		upstash_token,
		"--index-name",
		index_name,
		"--doc-url",
		doc_url,
	]

	print(f"[search:reindex] Crawling {doc_url}...")
	subprocess.run(command, check=True)


def main() -> int:
	try:
		load_environment()
		upstash_url, upstash_token, index_name = resolve_upstash_credentials()

		site_origin = normalize_origin(os.environ.get("SEARCH_DOC_ORIGIN") or DEFAULT_SITE_ORIGIN)
		doc_urls = [
			f"{site_origin}/articles",
			f"{site_origin}/services",
			f"{site_origin}/case-studies",
		]

		drop_index(upstash_url=upstash_url, upstash_token=upstash_token, index_name=index_name)
		for doc_url in doc_urls:
			crawl_doc_url(upstash_url=upstash_url, upstash_token=upstash_token, index_name=index_name, doc_url=doc_url)

		print(f"[search:reindex] Done. Index '{index_name}' refreshed.")
		return 0
	except subprocess.CalledProcessError as exc:
		print(f"[search:reindex] Crawler failed with exit code {exc.returncode}.", file=sys.stderr)
		return int(exc.returncode)
	except Exception as exc:  # noqa: BLE001
		print(f"[search:reindex] {exc}", file=sys.stderr)
		return 1


if __name__ == "__main__":
	raise SystemExit(main())
