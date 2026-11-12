#!/usr/bin/env python3
"""Verify an unchanged config roundtrip in memory; never save an upload file."""
import getpass
import hashlib
import json
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import decode_h300s_backup as decoder

root = Path(__file__).resolve().parent
password = getpass.getpass("Backup password: ").encode()
raw = (root.parent / "original.config").read_bytes()
plaintext, tree, _, _ = decoder.decode(raw, password)
inner_key = decoder.map_digest(decoder.md5(decoder.md5(b"sErCoMm" + b"eNtry3"),
    decoder.md5(b"sErCoMm"), decoder.md5(b"eNtry3")))
outer_key = decoder.map_digest(decoder.md5(
    decoder.md5(b"b7293e8150d1330c6c3d93f2fa81331b", password),
    decoder.md5(b"83f323b7132703029da5f4a9daa72a60", password),
    decoder.md5(b"48b526aa1f0552bf3e67f94a9afd3b45", password)))


def encrypt(key, value):
    n = 16 - len(value) % 16
    value += bytes([n]) * n
    cipher = Cipher(algorithms.AES(key), modes.CBC(decoder.IV)).encryptor()
    return cipher.update(value) + cipher.finalize()


inner = encrypt(inner_key, plaintext)
header = raw[:len(raw) - len(raw.split(b"\n", 5)[5])]
matches = []
for case, text in [("upper", inner.hex().upper().encode()), ("lower", inner.hex().encode())]:
    for suffix in [b"", b"\n", b"\r\n"]:
        if header + encrypt(outer_key, text + suffix) == raw:
            matches.append({"hex_case": case, "suffix_hex": suffix.hex()})
report = {"byte_identical_roundtrip": bool(matches), "format_matches": matches,
    "input_sha256": hashlib.sha256(raw).hexdigest(), "plaintext_written": False,
    "ciphertext_written": False, "password_saved": False}
path = root / "roundtrip-validation.json"
path.write_text(json.dumps(report, indent=2) + "\n")
path.chmod(0o600)
print(json.dumps(report))
