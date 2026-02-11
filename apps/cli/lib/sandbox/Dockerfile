FROM node:20-alpine

# Install common runtimes and tools
RUN apk add --no-cache \
    bash \
    python3 \
    py3-pip \
    git \
    curl \
    make \
    g++

WORKDIR /workspace

# Keep container alive for exec sessions
CMD ["sh", "-c", "sleep 1"]
