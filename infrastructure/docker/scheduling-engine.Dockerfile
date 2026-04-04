# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN useradd -m -u 1001 appuser

# Copy python dependencies from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set PATH to include user's local bin
ENV PATH=/home/appuser/.local/bin:$PATH

EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8081/health').status == 200"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
