"""Upload the verified exact-model stock debug image to the physical H300s.

This is intentionally a one-purpose destructive tool. It validates the local
image hash, authenticates as the recovered superuser, verifies the live
firmware/version, and submits only the stock firmware-upload endpoint.
"""
import hashlib
import http.client
import importlib.util
import re
import secrets
import time
import argparse
import os
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
IMAGE = ROOT / "current-debug-research.img"
EXPECTED_SHA256 = "13f388201a09800b79e32aa634fa229d32831dfeda16e4d7d8bb3c3971f0bd4d"
TARGET = "192.168.2.1"
IFACE = b"enp44s0\0"


def load_network():
    spec = importlib.util.spec_from_file_location("h300s_network", ROOT / "local-router-access.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Conn(http.client.HTTPConnection):
    def connect(self):
        import socket
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, IFACE)
        self.sock.connect((TARGET, 80))


def cookie_header(cookies):
    return "; ".join(f"{k}={v.value}" for k, v in cookies.items())


def main():
    global IMAGE, EXPECTED_SHA256
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=Path, default=IMAGE)
    parser.add_argument("--sha256", required=True)
    parser.add_argument("--expected-live-version", default="Vodafone-H-300s-v1.2.02.08")
    args = parser.parse_args()
    IMAGE = args.image
    EXPECTED_SHA256 = args.sha256
    digest = hashlib.sha256(IMAGE.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit(f"image hash mismatch: {digest}")
    image = IMAGE.read_bytes()
    cookies = SimpleCookie()
    cookies["login_uid"] = "0." + str(secrets.randbelow(10**15))
    token = ""
    headers = {"Host": TARGET, "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/130",
               "Accept-Language": "en-US,en;q=0.9", "Connection": "close"}

    def request(method, path, body=None, extra=None, timeout=30):
        nonlocal token
        h = dict(headers)
        h["Cookie"] = cookie_header(cookies)
        if token:
            sep = "&" if "?" in path else "?"
            path = path + sep + urlencode({"_": int(time.time() * 1000), "csrf_token": token})
        if extra:
            h.update(extra)
        if body is not None:
            h["Content-Length"] = str(len(body))
        c = Conn(TARGET, timeout=timeout)
        try:
            c.request(method, path, body=body, headers=h)
            r = c.getresponse()
            data = r.read()
            for k, v in r.getheaders():
                if k.lower() == "set-cookie":
                    cookies.load(v)
            if path.startswith("/login.html") or path.startswith("/overview.html"):
                m = re.search(rb"\bcsrf_token\s*=\s*['\"]([^'\"]+)", data)
                if m:
                    token = m.group(1).decode("ascii")
            return r.status, data
        finally:
            c.close()

    status, page = request("GET", "/login.html")
    print(f"Login page HTTP {status}, bytes {len(page)}", flush=True)
    if status not in (200, 302):
        raise SystemExit(f"login page HTTP {status}")
    if not token:
        raise SystemExit("no CSRF token")
    status, data = request("GET", "/data/login.json")
    if status != 200:
        raise SystemExit(f"challenge HTTP {status}")
    rows = __import__("json").loads(data)
    info = {k: v for row in rows if isinstance(row, dict) for k, v in row.items()}
    challenge = info.get("challenge")
    if not challenge:
        raise SystemExit("router did not provide login challenge")
    password = os.environ.get("H300S_PASSWORD")
    if not password:
        xml = ET.parse(ROOT / "firmware-analysis/Vodafone_H_300s_v1.2.02.08/default_GR.decrypted.xml")
        password = next((vals.get("Password") for node in xml.iter()
                         for vals in [{c.attrib.get("name"): c.attrib.get("value") for c in node}]
                         if vals.get("UserName") == "superuser"), None)
    if not password:
        raise SystemExit("superuser default not found")
    status, busy = request("POST", "/data/reset.json", b"chk_sys_busy=",
                           {"Content-Type": "application/x-www-form-urlencoded"})
    if status != 200 or busy.strip() == b"1":
        raise SystemExit(f"router busy/preflight failed: HTTP {status} {busy!r}")
    import hashlib as _hashlib
    login_hash = _hashlib.sha256((password + challenge).encode()).hexdigest()
    form = urlencode({"LoginName": "superuser", "LoginPWD": login_hash, "challenge": challenge}).encode()
    status, result = request("POST", "/data/login.json", form,
                             {"Content-Type": "application/x-www-form-urlencoded"})
    if status != 200 or result.strip().strip(b'"') != b"1":
        raise SystemExit(f"superuser login failed: HTTP {status} {result!r}")
    status, _ = request("GET", "/overview.html")
    if status != 200:
        raise SystemExit(f"overview HTTP {status}")
    status, role_data = request("GET", "/data/user_data.json")
    role_rows = __import__("json").loads(role_data)
    role = {k: v for row in role_rows if isinstance(row, dict) for k, v in row.items()}
    if role.get("usermode") != "admin" or role.get("fw_version") != args.expected_live_version:
        raise SystemExit(f"unexpected live role/version: {role.get('usermode')} {role.get('fw_version')}")

    boundary = "----CodexH300s" + secrets.token_hex(12)
    parts = []
    def field(name, value):
        parts.append((f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n").encode())
    field("MAX_FILE_SIZE", "102476800")
    field("uploadType", "image")
    parts.append((f"--{boundary}\r\nContent-Disposition: form-data; name=\"uploadedfile\"; filename=\"{IMAGE.name}\"\r\nContent-Type: application/octet-stream\r\n\r\n").encode())
    parts.append(image)
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(parts)
    print(f"Uploading verified image ({len(image)} bytes, sha256 {digest})", flush=True)
    status, response = request("POST", "/data/settings_fw_update.json", body,
                              {"Content-Type": f"multipart/form-data; boundary={boundary}",
                               "Referer": f"http://{TARGET}/settings.html"}, timeout=180)
    print(f"Upload response HTTP {status}: {response[:500]!r}", flush=True)


if __name__ == "__main__":
    main()
