# Stage 1: Build binary
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Cai dat timezone data va cac dependency he thong neu can
RUN apk add --no-cache tzdata git

COPY go.mod go.sum ./
ENV GOPROXY=https://goproxy.io,direct
RUN go mod download

COPY . .

# Build app Go (CGO_ENABLED=0 de tao static binary, nhe va an toan)
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server cmd/app/main.go

# Stage 2: Create a minimal image
FROM alpine:latest

WORKDIR /root/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
ENV TZ=Asia/Ho_Chi_Minh

# Copy file binary
COPY --from=builder /app/server .

# Expose port
EXPOSE 8081

CMD ["./server"]
