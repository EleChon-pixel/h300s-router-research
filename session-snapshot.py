"""Exact-unit status and settings export. No restore, shell enable, or firmware writes."""
import argparse
import getpass
import hashlib
import importlib.util
import json
import os
import re
import secrets
import time
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlencode, urlsplit, urljoin
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Session:
    def __init__(self):
        self.network = load("h300s_network", ROOT / "local-router-access.py")
        self.cookies = SimpleCookie()
        self.cookies["login_uid"] = "0." + str(secrets.randbelow(10**15))
        self.token = ""

    def request(self, path, fields=None):
        if path not in {"/login.html", "/overview.html", "/data/login.json", "/data/reset.json",
                        "/data/user_data.json", "/data/settings_access_control.json",
                        "/data/settings_configuration.json", "/data/Backup.json", "/Syslog.json"}:
            raise ValueError("Endpoint not allowlisted")
        if fields is not None:
            keys = set(fields)
            valid = ((path == "/data/login.json" and keys == {"LoginName", "LoginPWD", "challenge"})
                     or (path == "/data/reset.json" and keys == {"chk_sys_busy"})
                     or (path == "/data/settings_configuration.json"
                         and keys == {"ConfigurationSaveType", "ConfigurationSaveDescription", "ConfigurationSavePWD"}
                         and fields["ConfigurationSaveType"] == "computer"))
            if not valid:
                raise ValueError("Write operation not allowlisted")
        query = urlencode({"_": int(time.time() * 1000), "csrf_token": self.token}) if self.token else ""
        headers = {"Host": self.network.TARGET,
                   "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
                   "Referer": "http://" + self.network.TARGET + "/overview.html", "X-Requested-With": "XMLHttpRequest",
                   "Connection": "close", "Cookie": "; ".join(k + "=" + v.value for k, v in self.cookies.items())}
        body = None
        if fields is not None:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
            body = urlencode(fields)
        connection = self.network.EthernetConnection(self.network.TARGET, timeout=20)
        try:
            connection.request("POST" if fields is not None else "GET", path + ("?" + query if query else ""), body=body, headers=headers)
            response = connection.getresponse()
            data = response.read()
            for key, value in response.getheaders():
                if key.lower() == "set-cookie":
                    self.cookies.load(value)
            if response.status in {301, 302, 303, 307, 308} and path in {"/data/Backup.json", "/Syslog.json"} and fields is None:
                location = response.getheader("Location", "")
                target = urlsplit(urljoin("http://" + self.network.TARGET + "/data/Backup.json", location))
                if target.scheme != "http" or target.netloc != self.network.TARGET or not target.path.startswith("/download/"):
                    raise RuntimeError(f"Backup redirected to unexpected path {target.path}; not followed")
                download = self.network.EthernetConnection(self.network.TARGET, timeout=20)
                try:
                    download.request("GET", target.path + ("?" + target.query if target.query else ""), headers=headers)
                    result = download.getresponse()
                    content = result.read()
                    if result.status != 200:
                        raise RuntimeError(f"Backup download returned HTTP {result.status}")
                    return content
                finally:
                    download.close()
            if response.status != 200:
                raise RuntimeError(f"Unexpected HTTP status {response.status} for {path}")
            if path.endswith(".html"):
                match = re.search(rb"\bcsrf_token\s*=\s*['\"]([^'\"]+)['\"]", data)
                if match:
                    self.token = match[1].decode("ascii")
            return data
        finally:
            connection.close()

    def read(self, path):
        rows = json.loads(self.request(path))
        if not isinstance(rows, list):
            raise RuntimeError("Unexpected JSON layout")
        return {k: v for row in rows if isinstance(row, dict) for k, v in row.items()}

    def login(self):
        self.request("/login.html")
        if not self.token:
            # Some existing sessions redirect the login page to the overview.
            self.request("/overview.html")
            if not self.token:
                raise RuntimeError("Neither login nor overview returned a session token")
            role = self.read("/data/user_data.json")
            if role.get("usermode") == "admin" and role.get("fw_version") == "Vodafone-H-300s-v1.2.01.06_debug":
                return role
            raise RuntimeError("Existing session is not the expected privileged account")
        info = self.read("/data/login.json")
        if str(info.get("delay_time", "0")) not in {"0", ""}:
            raise RuntimeError("Router reports login delay; no login attempted")
        challenge = info.get("challenge")
        if not challenge:
            raise RuntimeError("No authentication challenge")
        password = os.environ.get("H300S_PASSWORD")
        if not password:
            xml = ET.parse(ROOT / "firmware-analysis/Vodafone_H_300s_v1.2.02.08/default_GR.decrypted.xml")
            for node in xml.iter():
                values = {c.attrib.get("name"): c.attrib.get("value") for c in node}
                if values.get("UserName") == "superuser":
                    password = values.get("Password")
                    break
        if not password:
            raise RuntimeError("Exact-firmware default not available")
        busy = self.request("/data/reset.json", {"chk_sys_busy": ""}).strip()
        if busy == b"1":
            raise RuntimeError("Router busy")
        digest = hashlib.sha256((password + challenge).encode()).hexdigest()
        password = None
        response = self.request("/data/login.json", {"LoginName": "superuser", "LoginPWD": digest, "challenge": challenge})
        if response.strip().strip(b'"') != b"1":
            raise RuntimeError("Single verified-default login did not succeed; not retried")
        self.request("/overview.html")
        role = self.read("/data/user_data.json")
        if role.get("usermode") != "admin" or role.get("fw_version") != "Vodafone-H-300s-v1.2.01.06_debug":
            raise RuntimeError("Role/version changed; stopping before export")
        return role


def private_write(path, content):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(content)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup", action="store_true")
    parser.add_argument("--syslog", action="store_true")
    args = parser.parse_args()
    password = getpass.getpass("Existing export password (not saved): ").encode() if args.backup else None
    session = Session()
    role = session.login()
    status = session.read("/data/settings_access_control.json")
    report = {"checked_utc": datetime.now(timezone.utc).isoformat(),
              "role": {k: role.get(k) for k in ["username", "usermode", "fw_version"]},
              "services": {k: status.get(k) for k in ["ssh_status", "ssh_lan", "ssh_wan", "telnet_status", "telnet_lan", "telnet_wan"]},
              "configuration_restored": False, "firmware_uploaded": False}
    print("Authenticated state:", json.dumps(report), flush=True)
    if args.syslog:
        data = session.request("/Syslog.json")
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        folder = ROOT / "unit-logs" / stamp
        folder.mkdir(parents=True, mode=0o700)
        private_write(folder / "system.log", data)
        text = data.decode(errors="replace")
        report["system_log"] = {"folder": str(folder), "bytes": len(data),
                                "sha256": hashlib.sha256(data).hexdigest(),
                                "lines": len(text.splitlines()),
                                "boot_term_counts": {k: text.lower().count(k.lower()) for k in ["Linux version", "U-Boot", "mtd", "nand", "UBI", "kernel"]}}
        private_write(folder / "inspection.json", (json.dumps(report, indent=2) + "\n").encode())
    if args.backup:
        answer = session.request("/data/settings_configuration.json", {
            "ConfigurationSaveType": "computer", "ConfigurationSaveDescription": "Pre-flash superuser settings export",
            "ConfigurationSavePWD": password.decode()})
        if answer.strip().strip(b'"') != b"1":
            raise RuntimeError("Backup generation did not report success; no restore attempted")
        data = session.request("/data/Backup.json")
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        folder = ROOT / "unit-backups" / stamp
        folder.mkdir(parents=True, mode=0o700)
        private_write(folder / "superuser.config", data)
        decoder = load("h300s_backup_decoder", ROOT / "config-analysis/decode_h300s_backup.py")
        plaintext, tree, outer_size, inner_size = decoder.decode(data, password)
        password = None
        private_write(folder / "superuser.xml", plaintext)
        group = data.split(b"\n", 5)[3].decode().split(":", 1)[1]
        objects = [n.attrib.get("name", "") for n in tree.iter() if n.tag == "OBJECT"]
        report["backup"] = {"folder": str(folder), "group": group, "bytes": len(data),
                            "sha256": hashlib.sha256(data).hexdigest(), "xml_bytes": len(plaintext),
                            "xml_elements": sum(1 for _ in tree.iter()), "xml_valid": True,
                            "ssh_object_names": [x for x in objects if "ssh" in x.lower() or "telnet" in x.lower()],
                            "full_flash_backup": False, "password_saved": False}
        private_write(folder / "validation.json", (json.dumps(report, indent=2) + "\n").encode())
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
