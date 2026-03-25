from scripts.search_relevancy import SearchRelevancyRow, collect_search_relevancy_rows, format_results_table


def test_collect_search_relevancy_rows_preserves_all_scored_results() -> None:
  rows = collect_search_relevancy_rows(
    [
      {
        'content': {'title': 'Introduction'},
        'metadata': {'path': '/articles/typescript-best-practices#introduction'},
        'score': 0.72,
      },
      {
        'content': {'title': 'TypeScript Best Practices for Modern Development'},
        'metadata': {'path': '/articles/typescript-best-practices'},
        'score': 1.0,
      },
      {
        'content': {'title': 'Case Study'},
        'metadata': {'path': '/case-studies/platform-migration'},
        'score': 0.95,
      },
      {
        'content': {'title': 'Missing Score'},
        'metadata': {'path': '/articles/missing-score'},
      },
    ]
  )

  assert rows == [
    SearchRelevancyRow(title='Introduction', path='/articles/typescript-best-practices#introduction', score=0.72),
    SearchRelevancyRow(
      title='TypeScript Best Practices for Modern Development',
      path='/articles/typescript-best-practices',
      score=1.0,
    ),
    SearchRelevancyRow(title='Case Study', path='/case-studies/platform-migration', score=0.95),
  ]


def test_format_results_table_renders_path_column_by_default() -> None:
  table = format_results_table(
    [
      SearchRelevancyRow(title='Article One', path='/articles/one', score=1.0),
      SearchRelevancyRow(title='Article Two', path='/articles/two', score=0.875),
    ]
  )

  assert 'Result Title' in table
  assert 'Path' in table
  assert 'Relevancy Score' in table
  assert 'Article One' in table
  assert '/articles/one' in table
  assert '0.875' in table


def test_format_results_table_can_hide_path_column() -> None:
  table = format_results_table(
    [
      SearchRelevancyRow(title='Article One', path='/articles/one', score=1.0),
    ],
    show_path=False,
  )

  assert 'Result Title' in table
  assert 'Path' not in table
  assert '/articles/one' not in table