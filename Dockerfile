# Build stage
FROM golang:1.24 AS builder
WORKDIR /app

# Install CA certs
RUN apt-get update && apt-get install -y ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api

# Run stage
FROM scratch
WORKDIR /app

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/api .

EXPOSE 8080
CMD ["./api"]
