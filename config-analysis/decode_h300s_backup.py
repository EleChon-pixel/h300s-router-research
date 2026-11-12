#!/usr/bin/env python3
"""Read-only H300s backup decoder with strict validation and hidden password.

Format/KDF source: edisionnano/Sercomm_Tools/h300s_plus/Scripts/cfg_tool.py
No router communication or encoding/restore capability is included.
"""
import argparse
import getpass
import hashlib
import json
import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

ALPHABET = b"26aejsw37bfktx48chmuy59dipvz"
IV = b"\x83" * 16


def md5(*parts):
    return hashlib.md5(b"".join(parts)).digest()


def map_digest(digest):
    buffer = bytearray(33)
    for index, byte in enumerate(digest):
        text = format(byte, "x").encode("ascii")
        offset = 2 * index
        buffer[offset:offset + len(text)] = text
        if offset + len(text) < len(buffer):
            buffer[offset + len(text)] = 0
    return bytes(ALPHABET[x % len(ALPHABET)] for x in buffer[:32])


def unpad_strict(data):
    if not data or not 1 <= data[-1] <= 16 or data[-data[-1]:] != bytes([data[-1]]) * data[-1]:
        raise ValueError("Invalid PKCS7 padding")
    return data[:-data[-1]]


def decrypt(key, data):
    if not data or len(data) % 16:
        raise ValueError("Ciphertext not block aligned")
    decryptor = Cipher(algorithms.AES(key), modes.CBC(IV)).decryptor()
    return unpad_strict(decryptor.update(data) + decryptor.finalize())


def decode(raw, password):
    fields = raw.split(b"\n", 5)
    names = [b"FW Version:", b"FW Description:", b"FW Create Time:", b"FW Group:", b"Board S/N:"]
    if len(fields) != 6 or any(not fields[i].startswith(names[i]) for i in range(5)):
        raise ValueError("Unexpected export header")
    outer = map_digest(md5(md5(b"b7293e8150d1330c6c3d93f2fa81331b", password),
                           md5(b"83f323b7132703029da5f4a9daa72a60", password),
                           md5(b"48b526aa1f0552bf3e67f94a9afd3b45", password)))
    hex_text = decrypt(outer, fields[5])
    if not re.fullmatch(rb"[0-9a-fA-F\s]+", hex_text):
        raise ValueError("Outer plaintext is not hexadecimal")
    inner_ciphertext = bytes.fromhex(hex_text.decode("ascii"))
    inner = map_digest(md5(md5(b"sErCoMm" + b"eNtry3"),
                           md5(b"sErCoMm"), md5(b"eNtry3")))
    plaintext = decrypt(inner, inner_ciphertext)
    xml = plaintext.rstrip(b"\0")
    root = ET.fromstring(xml)
    return plaintext, root, len(hex_text), len(inner_ciphertext)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    password = getpass.getpass("Backup password: ").encode()
    raw = args.file.read_bytes()
    plaintext, root, outer_length, inner_length = decode(raw, password)
    args.output.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(plaintext)
    report = {"input_sha256": hashlib.sha256(raw).hexdigest(),
              "outer_padding_valid": True, "outer_hex_valid": True,
              "outer_plaintext_bytes": outer_length,
              "inner_ciphertext_bytes": inner_length,
              "inner_padding_valid": True, "plaintext_bytes": len(plaintext),
              "plaintext_sha256": hashlib.sha256(plaintext).hexdigest(),
              "xml_parse_valid": True, "xml_root": root.tag,
              "xml_element_count": sum(1 for _ in root.iter()),
              "output": str(args.output), "router_modified": False,
              "password_saved": False}
    report_path = args.output.with_suffix(".validation.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    report_path.chmod(0o600)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
