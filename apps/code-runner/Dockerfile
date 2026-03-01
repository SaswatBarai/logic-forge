FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go mod tidy
RUN go build -o code-runner ./cmd/server/main.go

# Production stage - Need Alpine to run Java, G++, and Python
FROM alpine:3.19

# Install compilers and runtimes for the supported languages
RUN apk add --no-cache \
    python3 \
    openjdk21-jre \
    openjdk21-jdk \
    g++ \
    bash

WORKDIR /app
COPY --from=builder /app/code-runner .

# Create a sandbox directory with restricted permissions
RUN mkdir -p /tmp/sandbox && chmod 777 /tmp/sandbox

EXPOSE 3004

CMD ["./code-runner"]
