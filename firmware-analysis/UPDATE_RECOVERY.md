# Exact H300s stock OTA updater audit

Offline static audit, 2026-11-12. No router contact, firmware execution, uploads, config changes or flash writes. Target is extracted Vodafone H300s 1.2.02.08; current-debug libraries/imageupgrade compare equal except firmware-specific metadata and encrypted ftd. See REPORT.md for image identity/extraction. Source of conclusions is shipped MIPS code, decoded artifacts, and host OpenSSL verification; this is not a live recovery test.

## Result

The inspected normal OTA updater writes the inactive kernel/rootfs partition and its checksum partition, then changes the shared boot-selection flag. No bootloader write is called by this inspected path. All three acquired exact H300s UBI payloads have valid signatures under the bundled public key, including current debug. **Neither that signature nor the dual-bank layout establishes recoverability on the physical V3 unit.** Automatic fallback, bootloader recovery access, partition geometry and full raw backup of the actual unit remain unverified.

A modified OpenWrt payload cannot retain these RSA signatures. Successful decryption or rebuilding a transport wrapper is not signature acceptance.

## Reproduce and evidence

Run `python3 firmware-analysis/verify_ota_signatures.py` from any directory. The script only reads locally decoded images, writes extracted local signature files/results, and invokes host OpenSSL; it never executes MIPS firmware. Results are saved in `ota-signature-validation.json`: all three `Verified OK`, exit0. Public key SHA256 is `372bb224f57763f3dfc87f756175b2a7bcb971ae29d23ea826ccc81b218c2ac9`.

Disassembly saved as imageupgrade.disasm, libfwutil.disasm, libdualimage.disasm and libutility.disasm, produced with `mips-linux-gnu-objdump -dr`. Dynamic MIPS GOT call targets checked with `readelf -AW`. Native decompilation unavailable; statements below are bounded static control-flow reconstruction.

## Transport and cryptographic verification

Decoded plaintext is 160-byte device header, 128-byte descriptor, UBI payload, then 262144-byte footer. The executable `/usr/sbin/imageupgrade` handles the real operation. The separate `fw_update` executable is a downloader and must not be confused with the writer.

At imageupgrade 0x40134c–0x401374, signature is read at `file_size - 0x40000 + 0x600`, length256. First1536 bytes of footer are saved to `/var/fw_sig_full.bin` (0x4013f4–0x401420). The decoded transport file is truncated by262144 and stripped of the first288 bytes into `/var/kfs.img` (0x401450–0x401470). It runs:

```
/usr/sbin/openssl dgst -sha256 -verify /etc/signature_public.key -signature /var/fw_sig.bin /var/kfs.img
```

Call0x4014e4; nonzero status rejects the verification. Host verification reproduced this for current stock, current debug and older stock. This covers the UBI payload; it is not a cryptographic attestation of physical hardware, live installed key or the unbound ASCII device header.

## Hardware/product checks

imageupgrade reads112 ASCII hex characters from `/etc/pid` (function0x401eec) and image prefix; parser0x401e40 converts these to56 binary bytes copied at destination+7. It compares four hardware bytes at decoded offset4 (call0x401710) and four product bytes at offset38 (call0x401730). Function identifier is logged but no equality branch for it is observed here.

All three local candidates and extracted current stock `/usr/etc/pid` have hardware ID `43 53 39 00` (`CS9\0`), product `41 30 30 31` (`A001`). This is strong same-family image evidence. The actual unit's `/etc/pid` has not been read. The serial containing CS9 is consistent but is insufficient to prove hardware identity/partition compatibility. The public RSA key identifies a signing trust set, not independently an exact model.

## Bank mapping and writes

`libfwutil.so` reads a native-endian32-bit counter from the first128KiB of `/dev/mtd2` (local helper0x1f74); all-FF becomes0, out-of-range >=100 becomes0, I/O failure returns-1. Selection uses counter low bit:

| Counter parity | Active kfs | Inactive kfs | Active checksum | Inactive checksum |
| --- | --- | --- | --- | --- |
| even | /dev/mtd7 | /dev/mtd8 | /dev/mtd4 | /dev/mtd5 |
| odd | /dev/mtd8 | /dev/mtd7 | /dev/mtd5 | /dev/mtd4 |

Functions: get_inactive_rootfs0x25b8, get_active_rootfs0x2640, get_active_runflag_mtd0x28f0, get_inactive_runflag_mtd0x2978. `-g` and `-z` snapshot inactive paths into `/var/run/imageupgrade/rootfs` and `/var/run/imageupgrade/flag`; rcS lines162–163 creates directory and calls `imageupgrade -z`.

The upgrade path reads those snapshot files, converts MTD block paths to character paths, then:

1. flash_erase inactive kfs, entire partition (system0x4019bc).
2. nandwrite `/var/kfs.img` to inactive kfs (system0x401a18).
3. On success, flash_erase corresponding inactive checksum partition (0x401a4c).
4. nandwrite -p `/var/fw_sig_full.bin` there (0x401ad4).
5. Only after success, optional `-s` calls swap_active_rootfs (0x401bb0).
6. Optional `-r` syncs and calls `/usr/sbin/rc reboot start` (0x401bec).

`swap_active_rootfs`0x26c8 increments the counter (wrap100->0), saves it through helper0x21c8, and reads back; up to3 attempts. Helper reads128KiB of mtd2, replaces first4 bytes, erases the MTD via flash_erase, then rewrites that128KiB through write_blk and fsync. The shared selection flag therefore IS destructively updated; dual-bank is not equivalent to a power-loss-safe atomic transaction.

No bootloader-helper import/call appears in imageupgrade. Both `get_active_bootld_mtd`0x2880 and `get_inactive_bootld_mtd`0x28b8 in libfwutil return `/dev/mtd0` unconditionally; there is no evidence here for two bootloader copies. These findings describe this updater path, not every executable or firmware side effect.

The setup.cgi executable contains exact normal command strings `/usr/sbin/imageupgrade -dc /var/vd168.img > /dev/null` and `/usr/sbin/imageupgrade -usrl /var/vd168.img > /dev/null &`. These corroborate a separate decode/verify phase and a later upgrade/swap/reboot phase. Full CGI request-to-call reachability has not been reconstructed in this audit. The updater itself accepts flags independently: invoking it incorrectly is dangerous; none of these commands should be run on the router as a diagnostic.

## Runtime firmware version and debug gates

`libutility.so util_read_board_info_to_ram`0x12eb8 calls system(`imageupgrade -g`) at0x12eec. `-g` calls libfwutil get_running_fw_version0x2b68, reading `/etc/fw_version`, then writes `/tmp/fw_info/fw_ver` (imageupgrade0x4011b0–0x4011dc). Thus it publishes the running image version. rcS creates `/tmp/fw_info` atline97. Parent independently established getFwVersion0x5dbc consumes that file and adds the Vodafone prefix.

The inspected `-dc` candidate verification code does not publish the candidate version to `/tmp/fw_info/fw_ver`; it creates local extracted payload/footer files and `/tmp/verify_image`. Uploading a debug image cannot be assumed to unlock the running firmware's version gate without booting it. This is a bounded code-path finding, not proof that no other program can write the RAM file.

## Recovery assessment and remaining gaps

Answered: payload authenticity against extracted key; exact local image hardware/product IDs; bank-target selection and normal OTA write ordering; no observed bootloader write in normal updater; shared flag rewrite; running-version RAM population.

Unresolved: actual NAND geometry/partition table and live PID/key; which bank is booted on the physical unit; bootloader behavior when inactive image fails, validation of checksum footer at boot, automatic rollback timing/counters, usable UART/download recovery, ability to force previous bank externally, full raw backup including OOB/bad-block information/calibration, and encrypted ftd content. libdualimage exposes metadata helpers and does not by itself prove rollback logic. A saved web configuration export is not a full flash recovery image.

Conclusion: current-debug is an authentic same-family research candidate, not a green light to flash. A reliable recovery route must still be established under the user's stated recovery-first condition. Static evidence currently supports further read-only hardware identification and passive serial/boot diagnostics, not a destructive test.
