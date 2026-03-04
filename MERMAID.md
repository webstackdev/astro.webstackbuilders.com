# Mermaid usage

## src/content/articles/opentelemetry-span-design-granularity-overhead/pdf.mdx

```mermaid
gantt
    title Trace Waterfall (readable)
    dateFormat X
    axisFormat %L ms

    section Request
    HTTP GET /orders/123           :a1, 0, 150

    section Cache
    cache.get                      :a2, 5, 15

    section Database
    db.query orders                :a3, 20, 80

    section Enrichment
    enrichOrder                    :a4, 85, 140
    http.get /customers/456        :a5, 90, 120
    http.get /products/789         :a6, 90, 110
```
Figure: Readable trace waterfall with clear hierarchy.

```mermaid
flowchart TD
    A[Incoming Request] --> B{Head Sampling?}

    B -->|Yes| C[Create Spans]
    B -->|No| D[No Spans Created]

    C --> E[Export to Collector]
    E --> F{Tail Sampling?}

    F -->|Error?| G[Keep]
    F -->|Slow?| G
    F -->|High-value?| G
    F -->|Random 5%| G
    F -->|Otherwise| H[Drop]

    G --> I[Storage Backend]

    style D fill:#f96,color:#000
    style H fill:#f96,color:#000
    style G fill:#9f9,color:#000
```
Figure: Head sampling reduces overhead; tail sampling preserves interesting traces.

```mermaid
gantt
    title Trace Waterfall (over-instrumented)
    dateFormat X
    axisFormat %L ms

    section Request
    HTTP GET /orders/123           :a1, 0, 150

    section Validation
    validate.request               :a2, 2, 5
    parse.json                     :a3, 5, 8
    validate.orderId               :a4, 8, 10

    section Cache
    cache.get                      :a5, 10, 12
    serialize.key                  :a6, 10, 11
    redis.get                      :a7, 11, 12
    deserialize.result             :a8, 12, 13

    section Database
    db.getConnection               :a9, 15, 18
    db.query orders                :a10, 18, 75
    db.releaseConnection           :a11, 75, 77
    map.toEntity                   :a12, 77, 79

    section Response
    serialize.json                 :a13, 140, 145
    set.headers                    :a14, 145, 147
    send.response                  :a15, 147, 150
```
Figure: Over-instrumented trace—wall of spans obscures the critical path.

```mermaid
sequenceDiagram
    participant Client
    participant API as API Service
    participant Cache
    participant DB as Database
    participant Customers as Customers Service

    Client->>API: GET /orders/123
    Note over API: Root span: HTTP GET /orders/{id}

    API->>Cache: Get order:123
    Note over API: Child span: cache.get
    Cache-->>API: Miss

    API->>DB: SELECT * FROM orders
    Note over API: Child span: db.query orders
    DB-->>API: Order data

    API->>Customers: GET /customers/456
    Note over API: Child span: HTTP GET customers-service
    Note over Customers: Continues trace
    Customers-->>API: Customer data

    API-->>Client: Enriched order
    Note over API: Root span ends
```
Figure: Request instrumentation sequence.

```mermaid
flowchart LR
    subgraph correct[Correct: 1-100 spans]
        B1[batch.process] --> E1[item.failed event]
        B1 --> E2[item.failed event]
        B1 --> A1[batch.successful: 9998]
    end

    subgraph wrong[Wrong: 10,000 spans]
        I1[process.item] --> I2[process.item]
        I2 --> I3[process.item]
        I3 --> I4[...9,997 more...]
    end

    style correct fill:#9f9,color:#000
    style wrong fill:#f96,color:#000
```
Figure: Batch instrumentation approaches—events vs spans.

## src/content/articles/platform-architecture-control-plane-data-plane-separation/index.mdx

```mermaid
graph TB
    subgraph CP[Control Plane]
        A[API Server] --> B[State Store]
        A --> C[Controllers]
    end

    D[Isolation Boundary]

    subgraph DP[Data Plane]
        F[Worker Node 1]
        G[Worker Node 2]
        H[Worker Node 3]
    end

    C -->|"Desired State"| D
    D --> F
    D --> G
    D --> H

    F -->|"Actual State"| D
    G -->|"Actual State"| D
    H -->|"Actual State"| D
    D --> C
```
