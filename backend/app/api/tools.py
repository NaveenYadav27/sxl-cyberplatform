"""
Real-world tool proxy API.

Provides REAL backend-executed integrations:
- VirusTotal v3 API (hash / URL lookups)
- AbuseIPDB v2 API (IP reputation)
- HIBP k-Anonymity password range API
- In-process TCP port scanner (real socket scan)
- Hunter.io Domain Search API
- Shodan InternetDB (free, no API key required)

API keys are read from environment variables or a .env file.
"""

import os
import asyncio
import hashlib
import socket
import struct
import ipaddress

import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/tools", tags=["tools"])

# ─── API Key configuration (set these in backend/.env) ─────────────────────
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
ABUSEIPDB_API_KEY  = os.getenv("ABUSEIPDB_API_KEY", "")
HUNTER_API_KEY     = os.getenv("HUNTER_API_KEY", "")

# ────────────────────────────────────────────────────────────────────────────
# Helper: unified HTTP client with timeout
# ────────────────────────────────────────────────────────────────────────────
async def _get(url: str, headers: dict = None, params: dict = None, timeout: float = 12.0):
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url, headers=headers or {}, params=params or {})
        resp.raise_for_status()
        return resp.json()

# ════════════════════════════════════════════════════════════════════════════
# 1. VIRUSTOTAL – Real hash / URL analysis
# ════════════════════════════════════════════════════════════════════════════
@router.get("/virustotal/hash/{file_hash}")
async def vt_hash_lookup(file_hash: str):
    """
    Query VirusTotal v3 file report by MD5 / SHA-1 / SHA-256.
    Requires VIRUSTOTAL_API_KEY env var.
    Falls back to offline sandbox simulation if no key is configured.
    """
    if not VIRUSTOTAL_API_KEY:
        # Real computation – no fake data, only what we can compute locally
        sha256 = hashlib.sha256(file_hash.encode()).hexdigest() if len(file_hash) != 64 else file_hash
        return {
            "source": "offline",
            "note": "Set VIRUSTOTAL_API_KEY in backend/.env for live API results.",
            "submitted_hash": file_hash,
            "sha256_computed": sha256,
            "api_key_configured": False
        }

    url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    try:
        data = await _get(url, headers=headers)
        attrs = data.get("data", {}).get("attributes", {})
        stats = attrs.get("last_analysis_stats", {})
        results = attrs.get("last_analysis_results", {})

        engines = [
            {
                "name": engine,
                "verdict": info.get("category", "undetected"),
                "detection": info.get("result") or "clean",
            }
            for engine, info in results.items()
            if info.get("category") in ("malicious", "suspicious")
        ]

        return {
            "source": "virustotal_live",
            "hash": file_hash,
            "name": attrs.get("meaningful_name", ""),
            "type": attrs.get("type_description", ""),
            "size": attrs.get("size", 0),
            "sha256": attrs.get("sha256", ""),
            "md5": attrs.get("md5", ""),
            "sha1": attrs.get("sha1", ""),
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "undetected": stats.get("undetected", 0),
            "harmless": stats.get("harmless", 0),
            "total": sum(stats.values()),
            "threat_label": attrs.get("popular_threat_classification", {})
                                  .get("suggested_threat_label", "N/A"),
            "engines": engines[:20],   # top 20 hits
            "api_key_configured": True,
        }
    except httpx.HTTPStatusError as exc:
        return {"error": f"VT API error {exc.response.status_code}", "detail": exc.response.text}
    except Exception as exc:
        return {"error": str(exc)}


@router.get("/virustotal/url")
async def vt_url_lookup(url: str):
    """Scan a URL via VirusTotal. Pass url= as a query param."""
    if not VIRUSTOTAL_API_KEY:
        return {"source": "offline", "note": "Set VIRUSTOTAL_API_KEY in backend/.env", "api_key_configured": False}

    import base64
    url_id = base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()
    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    try:
        data = await _get(f"https://www.virustotal.com/api/v3/urls/{url_id}", headers=headers)
        attrs = data.get("data", {}).get("attributes", {})
        stats = attrs.get("last_analysis_stats", {})
        return {
            "source": "virustotal_live",
            "url": url,
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "harmless": stats.get("harmless", 0),
            "undetected": stats.get("undetected", 0),
            "final_url": attrs.get("last_final_url", url),
            "title": attrs.get("title", ""),
            "categories": attrs.get("categories", {}),
            "api_key_configured": True,
        }
    except Exception as exc:
        return {"error": str(exc)}


# ════════════════════════════════════════════════════════════════════════════
# 2. ABUSEIPDB – Real IP reputation check
# ════════════════════════════════════════════════════════════════════════════
@router.get("/abuseipdb/{ip_address}")
async def abuseipdb_check(ip_address: str):
    """
    Query AbuseIPDB v2 API for IP reputation.
    Requires ABUSEIPDB_API_KEY env var.
    """
    if not ABUSEIPDB_API_KEY:
        return {
            "source": "offline",
            "note": "Set ABUSEIPDB_API_KEY in backend/.env for live results.",
            "ip": ip_address,
            "api_key_configured": False
        }

    url = "https://api.abuseipdb.com/api/v2/check"
    headers = {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"}
    params  = {"ipAddress": ip_address, "maxAgeInDays": 90, "verbose": True}
    try:
        data = await _get(url, headers=headers, params=params)
        d = data.get("data", {})
        return {
            "source": "abuseipdb_live",
            "ip": d.get("ipAddress"),
            "confidence_score": d.get("abuseConfidenceScore", 0),
            "total_reports": d.get("totalReports", 0),
            "distinct_users": d.get("numDistinctUsers", 0),
            "country": d.get("countryCode", "N/A"),
            "isp": d.get("isp", "N/A"),
            "domain": d.get("domain", "N/A"),
            "usage_type": d.get("usageType", "N/A"),
            "is_tor": d.get("isTor", False),
            "is_whitelisted": d.get("isWhitelisted", False),
            "last_reported": d.get("lastReportedAt", "N/A"),
            "reports": [
                {
                    "reported_at": r.get("reportedAt", ""),
                    "comment": r.get("comment", ""),
                    "categories": r.get("categories", []),
                    "reporter_country": r.get("reporterCountryCode", ""),
                }
                for r in (d.get("reports") or [])[:10]
            ],
            "api_key_configured": True,
        }
    except httpx.HTTPStatusError as exc:
        return {"error": f"AbuseIPDB error {exc.response.status_code}", "detail": exc.response.text}
    except Exception as exc:
        return {"error": str(exc)}


# ════════════════════════════════════════════════════════════════════════════
# 3. SHODAN InternetDB – Real, free, no API key required
# ════════════════════════════════════════════════════════════════════════════
@router.get("/shodan/{ip_address}")
async def shodan_internetdb(ip_address: str):
    """
    Query Shodan InternetDB (free, no API key) for public intelligence on an IP.
    Returns ports, CPEs, vulnerabilities, hostnames, and tags.
    """
    try:
        data = await _get(f"https://internetdb.shodan.io/{ip_address}")
        return {
            "source": "shodan_internetdb_live",
            "ip": data.get("ip", ip_address),
            "hostnames": data.get("hostnames", []),
            "ports": data.get("ports", []),
            "cpes": data.get("cpes", []),
            "vulns": data.get("vulns", []),
            "tags": data.get("tags", []),
        }
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return {"source": "shodan_internetdb_live", "ip": ip_address, "note": "No Shodan data found for this IP (private/unknown).", "ports": [], "vulns": []}
        return {"error": f"Shodan error {exc.response.status_code}", "detail": exc.response.text}
    except Exception as exc:
        return {"error": str(exc)}


# ════════════════════════════════════════════════════════════════════════════
# 4. REAL TCP PORT SCANNER – runs server-side via Python sockets
# ════════════════════════════════════════════════════════════════════════════
class PortScanRequest(BaseModel):
    target: str
    ports: Optional[List[int]] = None   # defaults to well-known set
    timeout: Optional[float] = 1.0

@router.post("/portscan")
async def real_port_scan(req: PortScanRequest):
    """
    Real synchronous TCP connect scan executed on the backend server.
    Returns open/closed state per port with latency.
    """
    default_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 389,
                     443, 445, 587, 993, 995, 1433, 3306, 3389, 5432,
                     5985, 5986, 6379, 8000, 8080, 8443, 8888, 9200, 27017]
    ports_to_scan = req.ports or default_ports
    timeout = min(req.timeout or 1.0, 3.0)

    # Validate target
    try:
        target_ip = socket.gethostbyname(req.target)
    except socket.gaierror:
        return {"error": f"Cannot resolve host: {req.target}"}

    SERVICE_MAP = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
        80: "HTTP", 110: "POP3", 135: "MS-RPC", 139: "NetBIOS", 143: "IMAP",
        389: "LDAP", 443: "HTTPS", 445: "SMB", 587: "SMTP-TLS", 993: "IMAPS",
        995: "POP3S", 1433: "MSSQL", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
        5985: "WinRM-HTTP", 5986: "WinRM-HTTPS", 6379: "Redis", 8000: "HTTP-Alt",
        8080: "HTTP-Proxy", 8443: "HTTPS-Alt", 8888: "HTTP-Dev", 9200: "Elasticsearch",
        27017: "MongoDB",
    }

    results = []

    async def scan_port(port: int):
        try:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(target_ip, port),
                timeout=timeout
            )
            writer.close()
            await writer.wait_closed()
            return {"port": port, "state": "open", "service": SERVICE_MAP.get(port, "unknown")}
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return {"port": port, "state": "closed", "service": SERVICE_MAP.get(port, "unknown")}

    tasks = [scan_port(p) for p in ports_to_scan]
    scan_results = await asyncio.gather(*tasks)

    open_ports = [r for r in scan_results if r["state"] == "open"]
    closed_ports = [r for r in scan_results if r["state"] == "closed"]

    return {
        "source": "real_tcp_scan",
        "target": req.target,
        "resolved_ip": target_ip,
        "total_scanned": len(ports_to_scan),
        "open_count": len(open_ports),
        "open_ports": sorted(open_ports, key=lambda x: x["port"]),
        "closed_ports": sorted(closed_ports, key=lambda x: x["port"]),
    }


# ════════════════════════════════════════════════════════════════════════════
# 5. HIBP k-Anonymity Password Range – Real API (no key required)
# ════════════════════════════════════════════════════════════════════════════
@router.get("/hibp/range/{sha1_prefix}")
async def hibp_range(sha1_prefix: str):
    """
    Proxy the real HIBP k-Anonymity range endpoint.
    Returns raw hash suffix:count list from api.pwnedpasswords.com
    """
    if len(sha1_prefix) != 5:
        return {"error": "sha1_prefix must be exactly 5 hex characters"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.pwnedpasswords.com/range/{sha1_prefix.upper()}",
                headers={"Add-Padding": "true"}
            )
            resp.raise_for_status()
            return {"source": "hibp_live", "prefix": sha1_prefix.upper(), "data": resp.text}
    except Exception as exc:
        return {"error": str(exc)}


# ════════════════════════════════════════════════════════════════════════════
# 6. HUNTER.IO Domain Search – Real API
# ════════════════════════════════════════════════════════════════════════════
@router.get("/hunter/{domain}")
async def hunter_domain_search(domain: str):
    """
    Query Hunter.io API for email addresses associated with a domain.
    Requires HUNTER_API_KEY env var.
    """
    if not HUNTER_API_KEY:
        return {
            "source": "offline",
            "note": "Set HUNTER_API_KEY in backend/.env for live results.",
            "domain": domain,
            "api_key_configured": False
        }

    try:
        data = await _get(
            "https://api.hunter.io/v2/domain-search",
            params={"domain": domain, "api_key": HUNTER_API_KEY}
        )
        emails = data.get("data", {}).get("emails", [])
        return {
            "source": "hunter_live",
            "domain": domain,
            "pattern": data.get("data", {}).get("pattern", ""),
            "total_emails": len(emails),
            "emails": [
                {
                    "email": e.get("value"),
                    "first_name": e.get("first_name", ""),
                    "last_name": e.get("last_name", ""),
                    "position": e.get("position", ""),
                    "confidence": e.get("confidence", 0),
                    "sources": len(e.get("sources", []))
                }
                for e in emails
            ],
            "api_key_configured": True,
        }
    except Exception as exc:
        return {"error": str(exc)}


# ════════════════════════════════════════════════════════════════════════════
# 7. DNS Resolver – Real server-side DNS resolution
# ════════════════════════════════════════════════════════════════════════════
@router.get("/dns/{hostname}")
async def dns_resolve(hostname: str):
    """Real DNS A/AAAA resolution via Python socket."""
    try:
        results = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: socket.getaddrinfo(hostname, None)
        )
        addresses = list({r[4][0] for r in results})
        return {
            "source": "real_dns",
            "hostname": hostname,
            "addresses": addresses,
        }
    except socket.gaierror as exc:
        return {"error": str(exc), "hostname": hostname}


# ════════════════════════════════════════════════════════════════════════════
# 8. API Key Status – what's configured
# ════════════════════════════════════════════════════════════════════════════
@router.get("/status")
async def tool_api_status():
    return {
        "virustotal": bool(VIRUSTOTAL_API_KEY),
        "abuseipdb":  bool(ABUSEIPDB_API_KEY),
        "hunter":     bool(HUNTER_API_KEY),
        "shodan_internetdb": True,   # always free, no key needed
        "hibp": True,                # always free, no key needed
        "port_scanner": True,        # always available
        "dns_resolver": True,        # always available
    }
