"""Loopback-only browser access to the H300s via its dedicated Ethernet link."""
import http.client
import socket
import json
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit, urlencode

TARGET = "192.168.2.250"
INTERFACE = b"enp44s0\0"
PORT = 18080
HOP = {"connection", "proxy-connection", "keep-alive", "transfer-encoding",
       "te", "trailer", "upgrade", "proxy-authorization", "proxy-authenticate"}


class EthernetConnection(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, INTERFACE)
        self.sock.connect((TARGET, 80))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Never log URLs, credentials, or session tokens.

    def forward(self):
        if self.headers.get("Host") not in {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}:
            self.send_error(403)
            return
        if not self.path.startswith("/") or self.path.startswith("//"):
            self.send_error(400)
            return
        if self.path.startswith("/__h300s_read__/"):
            return self.inspect_status()
        with self.server.state_lock:
            if self.headers.get("Cookie"):
                self.server.session_cookie = self.headers["Cookie"]
                self.server.browser_headers = {k: v for k, v in self.headers.items()
                    if k.lower() in {"user-agent", "accept-language"}}
            token = parse_qs(urlsplit(self.path).query).get("csrf_token")
            if token:
                self.server.page_token = token[0]
        # Firmware/configuration uploads are excluded from this inspection proxy.
        if self.command not in {"GET", "HEAD", "POST"}:
            self.send_error(405)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0 or length > 65536:
                self.send_error(413)
                return
            body = self.rfile.read(length) if length else None
            if self.command == "POST":
                path = self.path.split("?", 1)[0]
                fields = parse_qs((body or b"").decode("utf-8"), keep_blank_values=True)
                busy_check = path == "/data/reset.json" and set(fields) == {"chk_sys_busy"} and len(fields["chk_sys_busy"]) == 1
                content_type = self.headers.get("Content-Type", "").split(";")[0].strip().lower()
                expected_fields = {
                    "icmp_wan", "icmp_lan",
                    "ssh_wan", "ssh_lan",
                    "http_wan", "http_lan",
                    "tr069_wan", "tr069_lan",
                    "trusted_network_list"
                }
                ssh_lan_change = (
                    path == "/data/settings_access_control.json"
                    and content_type == "application/x-www-form-urlencoded"
                    and set(fields) == expected_fields
                    and all(len(values) == 1 for values in fields.values())
                    and fields["ssh_wan"] == ["deny"]
                    and fields["ssh_lan"] == ["allow"]
                    and len(parse_qs(urlsplit(self.path).query).get("csrf_token", [])) == 1
                )
                allowed = path == "/data/login.json" or busy_check or ssh_lan_change
                if not allowed or "multipart/form-data" in self.headers.get("Content-Type", "").lower():
                    self.send_error(403, "Request blocked by H300s proxy policy")
                    return
            headers = {k: v for k, v in self.headers.items()
                       if k.lower() not in HOP | {"host", "content-length", "accept-encoding"}}
            headers["Host"] = TARGET
            headers["Accept-Encoding"] = "identity"
            for name in ("Origin", "Referer"):
                if name in headers:
                    for host in ("127.0.0.1", "localhost"):
                        headers[name] = headers[name].replace(
                            f"http://{host}:{PORT}", f"http://{TARGET}")
            conn = EthernetConnection(TARGET, timeout=15)
            try:
                conn.request(self.command, self.path, body=body, headers=headers)
                response = conn.getresponse()
                data = response.read()
                if "text/html" in response.getheader("Content-Type", ""):
                    token_match = re.search(rb"\bcsrf_token\s*=\s*['\"]([^'\"]+)['\"]", data)
                    if token_match:
                        with self.server.state_lock:
                            self.server.page_token = token_match[1].decode("ascii")
                self.send_response(response.status)
                for key, value in response.getheaders():
                    if key.lower() in HOP | {"content-length"}:
                        continue
                    if key.lower() == "location":
                        value = value.replace(f"http://{TARGET}", f"http://127.0.0.1:{PORT}")
                    self.send_header(key, value)
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(data)
            finally:
                conn.close()
        except (OSError, ValueError, http.client.HTTPException):
            self.send_error(502, "H300s Ethernet request failed")

    def inspect_status(self):
        allowed = {
            "user_data": {"usermode", "userprofile", "debug_fw", "fw_version"},
            "settings_fw_update": {"fw_version", "update_status", "update_msg"},
            "settings_access_control": {"ssh_lan", "ssh_status"},
            "settings_password": {"username", "user_id", "auto_logout"},
            "settings_configuration": set(),
            "firmware_page": set(),
        }
        name = self.path.removeprefix("/__h300s_read__/")
        if self.command != "GET" or self.headers.get("X-H300s-Inspect") != "1" or name not in allowed:
            self.send_error(403)
            return
        with self.server.state_lock:
            cookie, token = self.server.session_cookie, self.server.page_token
            browser_headers = dict(self.server.browser_headers)
        if not cookie or not token:
            result = {"ready": False, "message": "Refresh authenticated browser page once"}
        else:
            conn = EthernetConnection(TARGET, timeout=10)
            try:
                headers = dict(browser_headers)
                headers.update({"Host": TARGET, "Cookie": cookie,
                    "Referer": f"http://{TARGET}/overview.html", "Accept": "application/json, text/javascript, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest", "Connection": "close"})
                path = "/settings_page/settings_fw_update.html" if name == "firmware_page" else "/data/" + name + ".json"
                conn.request("GET", path + "?" + urlencode({"_": int(time.time() * 1000), "csrf_token": token}), headers=headers)
                response = conn.getresponse()
                body = response.read()
                result = {"ready": True, "status": response.status, "bytes": len(body)}
                if name == "firmware_page":
                    result["has_upload_input"] = bool(re.search(rb"type\s*=\s*['\"]file['\"]", body, re.I))
                    result["has_login_redirect"] = bool(re.search(rb"url\s*=\s*['\"]?login", body, re.I))
                try:
                    parsed = json.loads(body)
                    rows = parsed if isinstance(parsed, list) else [parsed]
                    result["field_names"] = sorted({k for row in rows if isinstance(row, dict) for k in row})
                    result["fields"] = [{k: v for k, v in row.items() if k in allowed[name]}
                                        for row in rows if isinstance(row, dict)]
                except ValueError:
                    result["json"] = False
            except (OSError, http.client.HTTPException) as error:
                result = {"ready": False, "message": "Router request failed", "error_type": type(error).__name__}
            finally:
                conn.close()
        data = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    do_GET = forward
    do_HEAD = forward
    do_POST = forward


if __name__ == "__main__":
    print(f"H300s inspection: http://127.0.0.1:{PORT}/login.html", flush=True)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    server.state_lock = threading.Lock()
    server.session_cookie = ""
    server.browser_headers = {}
    server.page_token = ""
    server.serve_forever()
