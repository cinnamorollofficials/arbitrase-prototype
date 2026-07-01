# Build Stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o price-worker ./cmd/price-worker

# Run Stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/price-worker .

CMD ["./price-worker"]
