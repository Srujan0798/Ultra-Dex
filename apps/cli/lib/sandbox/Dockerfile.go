FROM golang:1.22-alpine
RUN adduser -D appuser
USER appuser
WORKDIR /workspace
