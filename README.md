# Vodafone H300s / Sercomm router research

Reverse-engineering notes, firmware/config format tooling, a static API-dispatch
audit, and the automation used to run a Vodafone **H300s** (Sercomm, Realtek
RTL8685 platform) as a routed secondary access point behind a main router.

All work was done against **hardware the author owns**, for interoperability and
home-network segmentation. No third-party networks or accounts were touched.

## Contents

- `firmware-analysis/` — offline decoding of the exact-model OTA images (hybrid
  Sercomm Type1/Type2 KDF), UBI/SquashFS reconstruction, default-XML decryption,
  OTA signature-footer notes. Scripts only; **firmware blobs and extracted
  rootfs trees are not included** (vendor copyright; large).
- `config-analysis/` — two-layer AES config-backup codec and round-trip
  validation.
- `api-analysis/` — static reconstruction of the `setup.cgi` JSON dispatch table
  (1689 records / 143 groups) and the SSH access-control backend-gate finding
  (a stock-release `ssh_lan=allow` POST reports success but is silently gated on
  the debug firmware flag).
- `recovery-analysis/`, `native-analysis/` — supporting RE notes and references.
- Root-level `*.py` — the live setup/automation (routed-mode migration, DHCP
  reservations, guest/IoT SSID config, TV→media-server isolation). They talk to
  the router's web/CLI API and prompt for credentials with `getpass`.
- `AP_SETUP_STATUS.md` — the routed-mode setup writeup and running log.

## Prior work this builds on

Format/credential groundwork is from the community; this repo re-derives and
extends it. Credit to:

- **edisionnano/Sercomm_Tools** — H300s/Speedport Plus firmware, default-XML and
  config-backup format work (the upstream `h300s_tools_README.md` is included
  verbatim, with attribution).
- **k-marios/Gr_ISP_Router_Firmware** — Greek-ISP OTA firmware archive.
- **Psychotropos/sercomm_fwutils** — original Sercomm firmware decryptor.

Any superuser/default password shown in the included upstream READMEs is factory
default data already published in those public repositories.

## Sanitization

This is a scrubbed public copy. All credentials are entered at runtime and never
stored. SSIDs (`HOME-MAIN`/`HOME-GUEST`/`HOME-IOT`), MAC addresses
(`02:00:00:00:00:0x`), the public WAN IP (`<public-wan-ip>`) and the VPN IP
(`<tailscale-ip>`) are **placeholders** — substitute your own. Device backups,
decrypted config plaintext, session cookies and raw device syslogs are excluded
via `.gitignore`.

## Disclaimer

Provided for educational and interoperability research on your own equipment.
Modifying router firmware/config can brick the device or violate your ISP
contract. No warranty. Use at your own risk.
