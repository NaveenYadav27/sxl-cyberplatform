FROM python:3.11-slim

WORKDIR /opt/shadowxlab/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpcap-dev \
    iproute2 \
    iputils-ping \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /var/lib/shadowxlab

EXPOSE 8000 8088 514/udp 514/tcp

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
