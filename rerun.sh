
#!/bin/bash
pkill -f "go run cmd/app/main.go" || true
sleep 1
nohup go run cmd/app/main.go > internal/logs/nohup.out 2>&1 &
