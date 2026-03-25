from scripts.search_relevancy import ArticleRelevancyRow, collect_article_relevancy_rows, format_results_table


def test_collect_article_relevancy_rows_groups_sections_by_article() -> None:
  rows = collect_article_relevancy_rows(
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
    ]
  )

  assert rows == [
    ArticleRelevancyRow(
      path='/articles/typescript-best-practices',
      title='TypeScript Best Practices for Modern Development',
      score=1.0,
    )
  ]


def test_format_results_table_renders_two_columns() -> None:
  table = format_results_table(
    [
      ArticleRelevancyRow(path='/articles/one', title='Article One', score=1.0),
      ArticleRelevancyRow(path='/articles/two', title='Article Two', score=0.875),
    ]
  )

  assert 'Article Title' in table
  assert 'Relevancy Score' in table
  assert 'Article One' in table
  assert '0.875' in table