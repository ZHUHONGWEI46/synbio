# ============================================================
# Dockerfile — one-command reproducibility
# ============================================================
# Build:  docker build -t ai-synbio-team .
# Run:    docker run --rm -it -v $(pwd):/workspace ai-synbio-team bash
# ============================================================

FROM python:3.11-slim

# System deps you commonly need for ML + bio
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    wget \
    curl \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Workdir
WORKDIR /workspace

# Install Python deps first to leverage layer caching
COPY requirements.txt /workspace/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project (only used when running outside `-v` mount)
COPY . /workspace

# Default to an interactive shell
CMD ["bash"]
