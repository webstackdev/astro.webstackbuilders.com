from types import SimpleNamespace

from scripts.search_content_lengths import (
  OversizedContentRow,
  collect_oversized_content_rows,
  format_oversized_content_table,
)


def test_collect_oversized_content_rows_filters_and_sorts(monkeypatch) -> None:
  small_chunk = SimpleNamespace(
    source_path='src/content/articles/short/index.mdx',
    id='/articles/short#chunk-0',
    title='Short',
    section_heading='',
    section_content='x' * 100,
  )
  large_chunk = SimpleNamespace(
    source_path='src/content/articles/long/index.mdx',
    id='/articles/long#chunk-0',
    title='Long',
    section_heading='Heading',
    section_content='x' * 5000,
  )
  medium_chunk = SimpleNamespace(
    source_path='src/content/services/svc/index.md',
    id='/services/svc#chunk-0',
    title='Service',
    section_heading='Details',
    section_content='x' * 4100,
  )

  fake_pages = [
    SimpleNamespace(id='p1'),
    SimpleNamespace(id='p2'),
    SimpleNamespace(id='p3'),
  ]

  chunk_map = {'p1': [small_chunk], 'p2': [large_chunk], 'p3': [medium_chunk]}

  monkeypatch.setattr(
    'scripts.search_content_lengths.load_search_index_module',
    lambda: SimpleNamespace(
      discover_pages=lambda collections=None: fake_pages,
      chunk_page=lambda page: chunk_map[page.id],
    ),
  )

  rows = collect_oversized_content_rows(limit=4096)

  # large_chunk: len('Long') + len('Heading') + 5000 = 5011
  # medium_chunk: len('Service') + len('Details') + 4100 = 4114
  assert rows == [
    OversizedContentRow(content_path='src/content/articles/long/index.mdx [/articles/long#chunk-0]', char_length=5011),
    OversizedContentRow(content_path='src/content/services/svc/index.md [/services/svc#chunk-0]', char_length=4114),
  ]


def test_format_oversized_content_table_renders_expected_columns() -> None:
  table = format_oversized_content_table(
    [
      OversizedContentRow(content_path='src/content/articles/long/index.mdx [/articles/long#chunk-0]', char_length=5000),
    ]
  )

  assert 'Content Path' in table
  assert 'Character Length' in table
  assert 'src/content/articles/long/index.mdx' in table
  assert '5000' in table


def test_format_oversized_content_table_handles_empty_rows() -> None:
  assert format_oversized_content_table([]) == 'No indexed chunks exceed the content limit.'