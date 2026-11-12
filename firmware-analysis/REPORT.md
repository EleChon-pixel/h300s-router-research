# H300s offline firmware decoding: verified breakthrough

## Result
The three downloaded exact-model H300s images decode successfully. No router connection, executable firmware launch, account change, or flash was performed by this analysis agent.

The missing detail was an exact-model hybrid KDF: Type1 header layout but Type2 derivation, using bytes96:128 (nullpad2) rather than bytes64:96 (key_factor), and the unpadded version string. The generic Type1 decoder and the related SHG3060 XOR constant are wrong for these files.

## Reproduce
Run from the investigation directory:

```sh
python3 firmware-analysis/decode_h300s.py Vodafone_H_300s_v1.2.02.08.img firmware-analysis/Vodafone_H_300s_v1.2.02.08
```

The script uses the installed host cryptography module; it does not run firmware or contact the router. It verifies PKCS7 padding, every UBI EC/VID header CRC, static-volume data CRC, and contiguous logical eraseblocks before reconstructing volumes.

## Current release validation
- Outer header version:1.2.02.08. AES padding16 bytes validated.
- UBI payload starts at decoded offset288, size20447232 bytes,156 PEBs of131072 bytes.
- Volume0:27 LEBs,3422208 bytes, U-Boot kernel.
- Volume1:127 LEBs,16125952 bytes, SquashFS rootfs with16029668 bytes_used.
- Internal layout volume2147479551:2 LEBs.
- Rootfs SHA256:9293175ac5c08b063b666ea0471a0f304991eb62efbf1521e6a5fc772a8c3220.
- `7z l rootfs-reconstructed.squashfs` succeeds and reports1961 files,110 folders.
- `7z x` extracts regular files but returns exit2 because unsafe/absolute symlinks are ignored. This extracted tree is suitable for static file analysis, NOT a complete bootable tree. Do not enable dangerous-link extraction.

## Kernel validation
Kernel U-Boot header CRC and payload CRC both validate for release, debug and older image. Release and debug kernels are identical. Decompressed kernel SHA25678df997b00cbf168bd48bfccd8d8223c4944d63f78c5efd754c295cc21a61276;11992448 bytes. Kernel version is3.18.20-svn7533, Realtek MSDK4.8.5p1 Build2220, SDK2.4.1, builtJul29 2025. Load and entry addresses are0x80000000. CompressionLZMA, Linux/MIPS.

## Default configuration verification
Both current release and debug default_GR.xml decrypt with each image's own fw_version and the exact-model default XML KDF. gzip integrity and XML parsing succeed. Plaintexts are identical1062468 bytes; SHA25620baf9c507c17e3d58d1072b2289f84886a72a70e5af653bcc38bf761114acdb. The extracted superuser password equals the current Greek-retail credential documented in the exact-model README. Credentials are not reproduced here; decrypted XML mode0600. Parent was sent the verification.

## Debug comparison
Changed regular files include encrypted default configs, version metadata, certificates, TR64/TR69 files, and usr/sbin/ftd. Other regular binaries/libraries compare equal. This alone does not establish that flashing debug is safe or that its shell is reachable.

## Important limitations
The OTA contains a262144-byte footer after the kernel_rootfs payload, including nonzero data consistent with signatures/checksums. It has not been cryptographically verified or understood. Do not infer that a repacked image will be accepted. Decryption and valid payload CRCs prove internal consistency, not vendor authenticity, unit V3 compatibility, or reliable recovery.

Earlier wrong files were renamed related-xor-unvalidated.bin and direct-carve-unvalidated.bin, with failed-candidates.json descriptions. The direct raw SquashFS carve is invalid because physical UBI headers interleave the rootfs data; use reconstructed volume1.

## Primary sources
- https://github.com/edisionnano/Sercomm_Tools/tree/main/h300s_plus
- https://github.com/edisionnano/Sercomm_Tools/blob/main/h300s_plus/Scripts/decrypt_fw.py
- https://github.com/edisionnano/Sercomm_Tools/blob/main/h300s_plus/Scripts/decrypt_default_xml.py
- https://github.com/Psychotropos/sercomm_fwutils/blob/master/image_types.py

Downloaded source hashes and matching GitHub blob identities are in source-provenance.json. Each decoded image has validation.json and kernel.validation.json.
