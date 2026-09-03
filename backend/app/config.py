import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "ShadowXLab Purple Team Cyber-Range Appliance"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Public Control Plane Domain
    PUBLIC_BASE_URL: str = Field(default=os.getenv("PUBLIC_BASE_URL", "https://cybercareer.shadowxlab.com"))
    API_BASE_URL: str = Field(default=os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api/v1"))
    WS_BASE_URL: str = Field(default=os.getenv("WS_BASE_URL", "ws://127.0.0.1:8000/ws"))
    
    # Dual-NIC Network Settings
    MGMT_INTERFACE: str = Field(default="eth0", description="Management network interface (Web UI/API)")
    MGMT_IP: str = Field(default="192.168.1.50", description="Appliance Management IP")
    LAB_INTERFACE: str = Field(default="eth1", description="Lab / Cyber-Range monitoring network interface")
    LAB_CIDR: str = Field(default="10.10.10.0/24", description="Authorized Lab subnet boundary")
    LAB_IP: str = Field(default="10.10.10.50", description="Appliance Lab IP on eth1")
    
    # Persistent Storage Base
    DATA_DIR: str = Field(default=os.getenv("SHADOWXLAB_DATA_DIR", ""))
    DATABASE_URL: str = Field(default="")
    
    # Security & Encryption Keys
    SECRET_KEY: str = Field(default="shadowxlab-cyber-range-secret-key-change-in-prod-1234567890")
    ENCRYPTION_KEY: str = Field(default="u5XpB9Z9M4h8N7K6J5L4P3O2I1U0Y9T8R7E6W5Q4A3S=") # 32-byte Fernet base64 key
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Collector Ports
    SYSLOG_UDP_PORT: int = 514
    SYSLOG_TCP_PORT: int = 514
    HEC_HTTP_PORT: int = 8088
    
    # NTP / Time Sync Drift Thresholds (milliseconds)
    NTP_WARNING_MS: float = 250.0
    NTP_DEGRADED_MS: float = 500.0
    NTP_DISABLE_METRICS_MS: float = 1000.0
    
    # Data Retention (Days)
    RETENTION_RAW_EVENTS_DAYS: int = 30
    RETENTION_PCAP_DAYS: int = 7
    RETENTION_CASES_DAYS: int = 365
    
    # Operational Mode Override (empty = automatic state evaluation)
    OPERATIONAL_MODE_OVERRIDE: str = ""

    class Config:
        env_file = ".env"
        extra = "allow"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATA_DIR or not os.path.exists(self.DATA_DIR):
            local_data = Path(__file__).resolve().parent.parent / "data"
            local_data.mkdir(parents=True, exist_ok=True)
            self.DATA_DIR = str(local_data)
        
        if not self.DATABASE_URL:
            db_path = os.path.join(self.DATA_DIR, "shadowxlab.db")
            self.DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

settings = Settings()
