# syntax=docker/dockerfile:1.7
ARG GO_VERSION=1.21

FROM --platform=$BUILDPLATFORM golang:${GO_VERSION}-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY internal ./internal
COPY main.go .
ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT
RUN --mount=type=cache,target=/root/.cache/go-build \
	--mount=type=cache,target=/go/pkg/mod \
	CGO_ENABLED=0 \
	GOOS=${TARGETOS:-linux} \
	GOARCH=${TARGETARCH:-amd64} \
	$(if [ "${TARGETARCH}" = "arm" ] && [ -n "${TARGETVARIANT}" ]; then echo GOARM=${TARGETVARIANT#v}; fi) \
	go build -ldflags="-s -w" -o /upstash-redis-local main.go

FROM --platform=$TARGETPLATFORM gcr.io/distroless/base-debian12:nonroot
COPY LICENSE /licenses/UPSTASH_REDIS_LOCAL_LICENSE
COPY --from=build /upstash-redis-local /usr/local/bin/upstash-redis-local
USER nonroot
ENTRYPOINT ["upstash-redis-local"]
