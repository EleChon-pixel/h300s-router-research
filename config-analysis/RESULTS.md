# H300s backup decryption result

The supplied original.config is successfully decrypted. No router requests or changes were made.

## Evidence
- Input SHA256: 5ae3325df9a7cc37a1718547a7da5ee9c5f2449b9acea7e35b8e0f83dccca37a
- Source: https://github.com/edisionnano/Sercomm_Tools/blob/main/h300s_plus/Scripts/cfg_tool.py
- Description: https://github.com/edisionnano/Sercomm_Tools/tree/main/h300s_plus
- Source script reviewed before execution; independent cryptography-backed decoder implemented as decode_h300s_backup.py. No third-party package was installed.
- Export password entered via getpass without echo and held only in memory.
- Five ASCII header lines followed by 41232-byte ciphertext.
- Outer AES256-CBC layer: custom MD5/alphabet password-derived key; IV is sixteen 0x83 bytes.
- Outer padding validates; plaintext41216 bytes is exclusively uppercase ASCII hex.
- Hex decoding yields20608-byte inner ciphertext.
- Inner AES256-CBC layer: custom MD5/alphabet key derived from fixed Sercomm strings and empty productclass; same IV.
- Inner padding validates; plaintext20602 bytes; XML parses as DATAMODEL with275 elements.
- Plaintext SHA256: f366888a0f24c1cfd0af6f3b9b8286e9f2654bf6dd71453fadc015a2867939e1
- Decrypt and reencrypt the UNCHANGED plaintext in memory reproduces the original backup byte-for-byte. Original uses uppercase hex with NO trailing newline; upstream encode implementation adds a newline and is not byte-identical as written.

## Artifacts
- decoded/config.xml: sensitive private plaintext, mode0600, directory0700. Do not print or upload contents.
- decoded/config.validation.json: structural/cryptographic validation without credential values.
- roundtrip-validation.json: byte-identical unchanged roundtrip result.
- structure-summary.json: account-object presence and structural summary without secret values.
- validate_roundtrip.py: hidden-password in-memory roundtrip check; never emits an upload file.

## Limitations
The export includes only account object3 (Password parameter) and no SSH/Telnet objects. It appears to be a writable-settings overlay/delta; it is not a full NAND or complete default configuration backup. Decoding/roundtrip correctness does NOT establish safe configuration restore, server-side scope enforcement, privilege escalation, firmware compatibility or recovery. No modified config has been created or restored.

## Discarded cross-model lead
Related SHG3060 private-key RNG research was inspected, but its device-specific .p/PKCS7 format does not apply to this exact backup: exact-model two-layer decoder succeeds without a device private key. A bounded420-hypothesis generic CBC probe found no matches, then exact source resolved format. No full seed brute-force scan was launched.
