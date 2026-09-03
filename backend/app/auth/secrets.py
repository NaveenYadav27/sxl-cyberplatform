import json
import base64
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from app.config import settings

def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY.encode()
    # If key is not valid 32 url-safe base64, generate or pad
    try:
        return Fernet(key)
    except Exception:
        # Fallback to deterministic padded key for dev if needed
        padded = base64.urlsafe_b64encode((settings.SECRET_KEY.ljust(32, "x")[:32]).encode())
        return Fernet(padded)

def encrypt_secrets(data: Dict[str, Any]) -> str:
    """Encrypt sensitive credentials to a Fernet token string."""
    f = _get_fernet()
    raw = json.dumps(data).encode("utf-8")
    return f.encrypt(raw).decode("utf-8")

def decrypt_secrets(token: Optional[str]) -> Dict[str, Any]:
    """Decrypt a Fernet token string back to credentials dict."""
    if not token:
        return {}
    try:
        f = _get_fernet()
        decrypted = f.decrypt(token.encode("utf-8"))
        return json.loads(decrypted.decode("utf-8"))
    except Exception:
        return {}
