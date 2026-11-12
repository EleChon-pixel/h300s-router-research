# Flash readiness — H300s V3

Checked 2026-11-12. The verified same-family stock debug image was uploaded and the router rebooted successfully.

| Check | Result |
|---|---|
| Privileged web login | Verified superuser/admin on physical unit |
| Current running version | `Vodafone-H-300s-v1.2.02.08_debug` confirmed from post-reboot login page |
| Fresh settings export | unit-backups/20261112T012015Z/superuser.config; decoded and XML validated |
| Full NAND, OOB and calibration backup | Not obtained |
| Current debug archive authenticity | RSA-SHA256 payload signature independently Verified OK against extracted stock key |
| Archived stock/debug target identifiers | Both CS9 and A001; live /etc/pid not read |
| Normal OTA write path | Inactive kfs/checksum, then shared boot-selection flag; this path completed successfully once |
| Bootloader writes in inspected path | None observed |
| Shared flag transaction | Erases shared mtd2 then rewrites first128KiB; not atomic |
| Automatic rollback and external recovery | Not demonstrated on physical unit |
| Compatible OpenWrt payload | Not established; debug image is stock firmware, not OpenWrt |
| Modified rootfs via stock uploader | Existing RSA signature would not validate |

The signed debug image was accepted and booted. This is not a verified OpenWrt port or recovery procedure. Full NAND/OOB backup and external recovery remain unavailable. Telnet and SSH probes after reboot were both refused, so a separate debug-access mechanism is still needed.

## Stock access routes checked
- Real account is privileged; ordinary account name admin had modeuser.
- api_get_cmd/api_set_cmd occur in a common-code auth exception list, but neither is registered in the complete1689record dispatcher. No arbitrary-CML route established.
- Stock SSH setter is gated by _debug in running firmware version, even for superuser. General success response can conceal skipped SSH writes.
- _debug gate reads /tmp/fw_info/fw_ver; imageupgrade -g populates it from running /etc/fw_version. Candidate verification does not change it in inspected code.
- Config restore factory-resets before import according to user's saved audit; not used.
- Download path normalization prevents the proposed arbitrary /proc or NAND read in inspected server.
- System-log export succeeded: unit-logs/20261112T013204Z/system.log,67060bytes1194lines, no Linuxversion/U-Boot/mtd/nand/UBI/kernel terms. It did not provide a partition map or NAND backup.

## Next evidence required
A supported read-only stock mechanism to obtain physical PID/partition/bank/NAND backups, or a demonstrated bootloader recovery/previous-bank selection mechanism. No such route has been established under the current closed-case constraint. Keep the existing firmware in place while investigating this gap.

Details: firmware-analysis/UPDATE_RECOVERY.md; api-analysis/API_FINDINGS.md; api-analysis/DOWNLOAD_PATH.md; FINDINGS.md.
