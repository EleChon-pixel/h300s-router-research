#!/usr/bin/env python3
"""Bounded offline config-format hypotheses. Password is read without echo.

This does not claim cross-model compatibility. A match requires a complete
zlib stream and structurally plausible XML/container content, not padding alone.
No password, key, IV or plaintext is printed or saved.
"""
import argparse
import getpass
import hashlib
import json
import re
import zlib
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def keys(password):
    variants = {"raw": password, "padded32": password[:32].ljust(32, b"\0")}
    candidates = {}
    for name, value in variants.items():
        digest = hashlib.md5(value).digest()
        candidates[name + "-md5"] = digest
        candidates[name + "-md5-repeated"] = digest * 2
        candidates[name + "-md5hex"] = digest.hex().encode()
        candidates[name + "-sha256"] = hashlib.sha256(value).digest()
    candidates["padded16-direct"] = password[:16].ljust(16, b"\0")
    candidates["padded32-direct"] = password[:32].ljust(32, b"\0")
    # Related-device public/illustrative constants, not H300s verified keys.
    related = {
        "public-VD5244BV2-scrambled": b"9382D105FCB222798AD2B7F059A1476D",
        "public-H500-scrambled": b"A356C31E0F4704DB0BE6FA354BB06970",
        "public-H500-unscrambled": b"A35669700F47FA350BE604DB4BB0C31E",
        "published-example-private": bytes.fromhex("2014fe341147644e24a6bbd75ba575eee300ae2a6905506d49ea7d813fd7bf85"),
    }
    for public_name, value in related.items():
        for pw_name, pw in variants.items():
            for label, v in [("full", value), ("c-string", value.split(b"\0")[0])]:
                candidates[f"related-{public_name}-{pw_name}-{label}"] = hashlib.md5(pw).digest() + hashlib.md5(v).digest()
    for digest_name in ("md5", "sha256"):
        material = b""
        previous = b""
        while len(material) < 48:
            previous = hashlib.new(digest_name, previous + password).digest()
            material += previous
        candidates["evp-nosalt-" + digest_name] = material[:32]
    return candidates


def validate(raw):
    # Known related plaintext envelope: zlib stream at the beginning. Also
    # permit its common length/header prefixes, but demand a complete stream.
    for offset in (0, 4, 16, 32, 40, 128, 160, 300):
        if offset >= len(raw):
            continue
        try:
            d = zlib.decompressobj()
            plaintext = d.decompress(raw[offset:], 8 * 1024 * 1024)
            if d.eof and plaintext:
                return {"compression_offset": offset, "decompressed_bytes": len(plaintext),
                        "xml_marker": bool(re.search(rb"<(?:\?xml|DATA|InternetGatewayDevice|Device)\b", plaintext)),
                        "bounded_container": len(plaintext) >= 1208}
        except zlib.error:
            pass
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    password = getpass.getpass("Backup password: ").encode()
    data = args.file.read_bytes()
    header = data.split(b"\n", 5)
    if len(header) != 6 or not header[0].startswith(b"FW Version:"):
        raise SystemExit("Unexpected header")
    payload = header[5]
    ivs = {"zero": bytes(16), "prefix": payload[:16],
           "related-public-iv": b"4B7378949713AC65",
           "related-public-iv-scrambled": b"4B73AC6597137894",
           "published-example-private-iv": bytes.fromhex("55e7905212bb81daa96584c50435c6a0")}
    tried, matches = 0, []
    seen = set()
    for key_name, key in keys(password).items():
        for offset in (0, 16, 32, 300):
            ct = payload[offset:]
            ct = ct[:len(ct) // 16 * 16]
            for iv_name, iv in ivs.items():
                identity = (key, iv, offset)
                if identity in seen:
                    continue
                seen.add(identity)
                decryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
                raw = decryptor.update(ct) + decryptor.finalize()
                tried += 1
                result = validate(raw)
                if result:
                    matches.append({"key_hypothesis": key_name, "iv_hypothesis": iv_name,
                                    "ciphertext_offset": offset, **result})
    report = {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
              "payload_bytes": len(payload), "hypotheses_tested": tried, "matches": matches,
              "password_saved": False, "plaintext_saved": False,
              "limitation": "Bounded CBC/KDF variants; no match does not exclude AES, a private device key, or another format."}
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n")
        args.report.chmod(0o600)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
