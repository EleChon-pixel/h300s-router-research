# Vodafone H300s research state

Updated 2026-11-12.

## Device

- Vodafone Greece / Sercomm H300s, hardware V3, RTL8685 MIPS.
- Serial: `<device-serial>`.
- MAC: `02:00:00:00:00:03`.
- Firmware: `Vodafone-H-300s-v1.2.02.08`.
- Bootloader: `1.01.1`.
- Wireless driver: `4.0.6`.

## Current access

- Privileged web administration is working.
- Restricted appliance CLI/Telnet access is available when enabled.
- The CLI exposes high-level serial, firmware, hardware, and bootloader information.
- No verified Linux root shell, arbitrary file read, raw NAND read, or `/dev/mtd11` access has been obtained.

## Credentials and backups

- Credentials were tested during the investigation, but plaintext passwords are intentionally not recorded here.
- The user supplied an admin password and a backup-encryption password; both are redacted and should not be committed to Git, notes, or scripts.
- Encrypted configuration backups and firmware artifacts are under `unit-backups/` and the project directory. Their SHA256 values and backup metadata are documented in existing analysis files.
- Do not upload backups, cookies, or credential-bearing files to public repositories.

## Firmware/root research

- Community documentation says firmware before `1.2.01.06` had legacy superuser access; newer firmware requires restoring a previously modified backup. This is web administration, not confirmed Linux root.
- No verified model-specific root-shell exploit was found for V3 firmware `1.2.02.08`.
- Older/OneNet firmware tests did not produce a full shell; reported SSH/Telnet access is a restricted CLI.
- Firmware analysis found the `/var/.ft` marker and `/tmp/ftd` debug path. A factory metadata comparison involving mtd11 offsets `0x20` and `0x1d4` may create that marker. This is a risky provisioning trigger, not a safe exploit; do not alter NAND metadata blindly.
- Read-only audit found no proven web-to-root command injection or backup-to-root restore path.

## Network plan

- Main router and H300s both originally used `192.168.2.1`; never connect them before changing the H300s address.
- H300s original DHCP range was `192.168.2.2–192.168.2.254`.
- Candidate H300s LAN address: `192.168.2.250`, only after checking/reserving it outside the main router DHCP pool.
- LAN-to-LAN fallback: change H300s LAN IP, disable H300s DHCP, connect main-router LAN to H300s LAN, configure `Home-IoT` and `Home-Guest` WPA2 SSIDs, enable guest AP isolation, then test wired-LAN reachability.
- Latest local scan found active hosts `.1`, `.3`, `.4`, `.6`, `.7`, `.8`; `.250` did not respond but still must be checked against the DHCP pool.

## Direct laptop connection

With the H300s disconnected from the main router, set the laptop Ethernet interface to `192.168.2.3/24` with no gateway, disable Wi-Fi, access `http://192.168.2.1`, then restore Ethernet DHCP and Wi-Fi after changing the H300s address.

## Sources

- https://openwrt.org/toh/vodafone/vodafoneh300s
- https://github.com/k-marios/Gr_ISP_Router_Firmware
- https://github.com/k-marios/Gr_ISP_Router_Firmware/blob/main/ROOT_PASSWORDS.md
- https://www.adslgr.com/forum/threads/1074686-Vodafone-H-300s-router/
