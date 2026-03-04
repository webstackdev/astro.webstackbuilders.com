const rows = [
  { classification: 'Actionable', criteria: '≥ 80%', action: 'Keep, improve runbook' },
  { classification: 'Noisy', criteria: '20-80%', action: 'Investigate thresholds, consider aggregation' },
  { classification: 'Useless', criteria: '< 20%', action: 'Delete or convert to dashboard metric' },
  { classification: 'Stale', criteria: 'Not fired in 3+ months', action: 'Review for deletion' },
]

const getTimelineColor = (index: number): 'success' | 'warning' | 'danger' | 'info' => {
  switch (index % 4) {
    case 0:
      return 'success'
    case 1:
      return 'warning'
    case 2:
      return 'danger'
    default:
      return 'info'
  }
}

const getSemanticColor = (index: number): 'success' | 'warning' | 'danger' | 'info' => {
  switch (index % 4) {
    case 0:
      return 'success'
    case 1:
      return 'warning'
    case 2:
      return 'danger'
    default:
      return 'info'
  }
}

const baseTableContent = {
  figure: 'Alert classification buckets based on action rate.',
  thead: {
    th: ['Classification', 'Criteria', 'What To Do'],
  },
  tbody: {
    tr: rows.map(row => ({
      td: [row.classification, row.criteria, row.action],
    })),
  },
}

const semanticTableContent = {
  figure: 'Alert classification buckets based on action rate.',
  thead: {
    th: ['Criteria', 'Remediation'],
  },
  tbody: {
    tr: rows.map((row, index) => ({
      th: {
        label: row.classification,
        color: getSemanticColor(index),
      },
      td: [row.criteria, row.action],
    })),
  },
}

const timelineTableContent = {
  figure: 'Alert classification buckets based on action rate.',
  thead: {
    th: ['Classification', 'Criteria', 'What To Do'],
  },
  tbody: {
    tr: rows.map((row, index) => ({
      th: {
        label: row.classification,
        color: getTimelineColor(index),
      },
      td: [row.criteria, row.action],
    })),
  },
}

const reportTableContent = {
  caption: 'Alert triage reference matrix',
  figure: 'Alert classification buckets based on action rate.',
  thead: {
    th: ['Classification', 'Criteria', 'What To Do'],
  },
  tbody: {
    tr: rows.map(row => ({
      td: [row.classification, row.criteria, row.action],
    })),
  },
}

const softHeaderCardContent = {
  caption: 'Alert Classification Guide',
  subcaption: 'Use this to quickly decide action priority.',
  figure: 'Alert classification buckets based on action rate.',
  thead: {
    th: ['Classification', 'Criteria', 'What To Do'],
  },
  tbody: {
    tr: rows.map(row => ({
      td: [row.classification, row.criteria, row.action],
    })),
  },
}

export const tableContent = {
  baseTableContent,
  semanticTableContent,
  timelineTableContent,
  reportTableContent,
  softHeaderCardContent,
}
