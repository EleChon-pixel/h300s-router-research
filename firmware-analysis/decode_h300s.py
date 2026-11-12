#!/usr/bin/env python3
"""Offline H300s OTA decoder and UBI volume reconstructor. Never flashes or runs firmware.

KDF independently adapted from the reviewed exact-model implementation:
https://github.com/edisionnano/Sercomm_Tools/blob/main/h300s_plus/Scripts/decrypt_fw.py
Default XML KDF:
https://github.com/edisionnano/Sercomm_Tools/blob/main/h300s_plus/Scripts/decrypt_default_xml.py
Requires host Python cryptography. All output stays below the selected output directory.
"""
import argparse
import collections
import gzip
import hashlib
import json
import struct
import xml.etree.ElementTree as ET
import zlib
from pathlib import Path

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

ALPHABET = b"26aejsw37bfktx48chmuy59dipvz"
SALT1 = b"83f323b7132703029da5f4a9daa72a60"
SALT2 = b"b7293e8150d1330c6c3d93f2fa81331b"
XML_SALT = b"48b526aa1f0552bf3e67f94a9afd3b45"
PEB_SIZE = 131072


def md5(*chunks):
    return hashlib.md5(b"".join(chunks)).digest()


def transform(digest):
    expanded = b"".join((format(x, "x").encode() + b"\0") if x < 16
                        else format(x, "02x").encode() for x in digest)
    return bytes(ALPHABET[x % 28] for x in expanded)


def decrypt_cbc(ciphertext, key, iv):
    assert len(ciphertext) % 16 == 0
    decoder = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
    return decoder.update(ciphertext) + decoder.finalize()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, data):
    path.write_bytes(data)
    path.chmod(0o600)


def decode_image(image, out):
    blob = image.read_bytes()
    fields = [blob[i:i + 32] for i in range(0, 160, 32)]
    assert len(fields) == 5 and all(len(x) == 32 for x in fields)
    version = fields[1].split(b"\0")[0]
    size = int(fields[4].split(b"\0")[0])
    # Critical H300s difference from generic Type2: nullpad2 is bytes96:128;
    # version is unpadded. IV comes from bytes64:80.
    key = transform(md5(md5(fields[3], version), md5(SALT2, version), md5(SALT1, version)))
    raw = decrypt_cbc(blob[160:], key, fields[2][:16])
    assert 0 < size < len(raw)
    padding = raw[size:]
    assert 1 <= len(padding) <= 16 and padding == bytes([len(padding)]) * len(padding)
    plaintext = raw[:size]
    assert plaintext[160:192].split(b"\0")[0] == b"kernel_rootfs"
    ubi_size = int(plaintext[192:224].split(b"\0")[0])
    ubi_start = 288
    ubi = plaintext[ubi_start:ubi_start + ubi_size]
    assert len(ubi) == ubi_size and len(ubi) % PEB_SIZE == 0
    volumes = collections.defaultdict(dict)
    for start in range(0, len(ubi), PEB_SIZE):
        peb = ubi[start:start + PEB_SIZE]
        assert peb[:4] == b"UBI#"
        vid_offset, data_offset = struct.unpack_from(">II", peb, 16)
        assert 64 <= vid_offset < data_offset < PEB_SIZE
        vid = peb[vid_offset:vid_offset + 64]
        assert vid[:4] == b"UBI!"
        assert zlib.crc32(peb[:60]) ^ 0xffffffff == struct.unpack_from(">I", peb, 60)[0]
        assert zlib.crc32(vid[:60]) ^ 0xffffffff == struct.unpack_from(">I", vid, 60)[0]
        volume_id, logical_number = struct.unpack_from(">II", vid, 8)
        data = peb[data_offset:]
        if vid[5] == 2:  # Static volume: its last LEB need not be full.
            data_size = struct.unpack_from(">I", vid, 20)[0]
            data = data[:data_size]
            assert zlib.crc32(data) ^ 0xffffffff == struct.unpack_from(">I", vid, 32)[0]
        assert logical_number not in volumes[volume_id]
        volumes[volume_id][logical_number] = data
    out.mkdir(parents=True, exist_ok=True, mode=0o700)
    report = {"input": str(image.resolve()), "input_sha256": sha(blob),
              "version": version.decode(), "padding_valid": True,
              "ubi_offset": ubi_start, "ubi_bytes": len(ubi),
              "peb_count": len(ubi) // PEB_SIZE, "ec_vid_crcs_valid": True,
              "footer_bytes": len(plaintext) - ubi_start - ubi_size,
              "limitations": ["Source authenticity and device compatibility not proved.",
                              "OTA footer/signature validation not implemented.",
                              "No repacking, executable firmware launch, or flashing performed."],
              "volumes": []}
    save(out / "decrypted-validated.bin", plaintext)
    save(out / "kernel_rootfs.ubi", ubi)
    for volume_id, blocks in sorted(volumes.items()):
        assert sorted(blocks) == list(range(len(blocks)))
        data = b"".join(blocks[k] for k in sorted(blocks))
        save(out / f"volume-{volume_id}.bin", data)
        item = {"id": volume_id, "lebs": len(blocks), "bytes": len(data), "sha256": sha(data)}
        if data[:4] == b"hsqs":
            used = struct.unpack_from("<Q", data, 40)[0]
            assert 96 <= used <= len(data)
            assert struct.unpack_from("<HH", data, 28) == (4, 0)
            save(out / "rootfs-reconstructed.squashfs", data[:used])
            item["squashfs_bytes_used"] = used
            item["squashfs_sha256"] = sha(data[:used])
        report["volumes"].append(item)
    save(out / "validation.json", (json.dumps(report, indent=2) + "\n").encode())
    return report


def decode_default_xml(input_path, version_path, output_path):
    version = version_path.read_bytes().strip()
    key = transform(md5(md5(SALT2, version), md5(SALT1, version), md5(XML_SALT, version)))
    raw = decrypt_cbc(input_path.read_bytes(), key, b"\x83" * 16)
    pad = raw[-1]
    assert 1 <= pad <= 16 and raw[-pad:] == bytes([pad]) * pad
    plaintext = raw[:-pad]
    if plaintext.startswith(b"\x1f\x8b"):
        plaintext = gzip.decompress(plaintext)  # gzip module validates CRC and length.
    ET.fromstring(plaintext)
    save(output_path, plaintext)
    return {"xml_bytes": len(plaintext), "sha256": sha(plaintext), "xml_valid": True}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    report = decode_image(args.image, args.output_dir)
    print(json.dumps(report, indent=2))
