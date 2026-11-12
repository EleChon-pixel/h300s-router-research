# Exact-model H300s source, porting and recovery investigation

Scope: public research and local static review only. No packets sent to router, no logins, no writes, no contacting maintainers. Date: 2026-11-11. Target is Greek H300s V3 firmware1.2.02.08.

## Result
No verified closed-case recovery route or existing OpenWrt port for this exact unit was located. No compatible flashable payload was produced. Generic Sercomm recovery tooling must not be equated with tested H300s recovery.

## New source lead checked and rejected
Live GitHub repository search for H300s returned only pcmagas credential app and S10soz-21/Vodafone-h300s. The latter describes itself in Turkish as H300s source code, but metadata reports size=0, created_at=pushed_at=2022-05-25T10:05:37Z. Contents API returned404. This is an empty repository, not a source package. Metadata retained locally.
URL: https://github.com/S10soz-21/Vodafone-h300s
API: https://api.github.com/repos/S10soz-21/Vodafone-h300s
Search: https://api.github.com/search/repositories?q=H300s&per_page=100

The exact R065-A-2022-0022 archive identifier still only led to the first-person 2022 Technopat thread associating source with firmware1.2.00.09. The indexed thread includes a 2026 request stating the old MediaFire link is dead. Full page access was blocked403; no archive contents verified. No working mirror found in bounded searches of identifier, variants, H300s GPL/source and GitHub repositories.
https://www.technopat.net/sosyal/konu/kaynak-kodlarindan-gpl-code-nasil-yazilim-dosyasi-cikarilir.2118655/

## OpenWrt status evidence
Official openwrt/openwrt GitHub issue/PR searches for RTL8685 and H300s each returned total_count=0 (JSON retained). This only covers indexed issues/PRs containing those strings, not all branches/private work.
https://api.github.com/search/issues?q=repo%3Aopenwrt%2Fopenwrt%20RTL8685&per_page=100
https://api.github.com/search/issues?q=repo%3Aopenwrt%2Fopenwrt%20H300s&per_page=100
Current target realtek declaration inspected earlier by parent lists RTL83xx/93xx/960x, not RTL8685. Do not infer support from realtek target name.
https://github.com/openwrt/openwrt/blob/main/target/linux/realtek/Makefile

A primary researcher on the different Sercomm LTE2122GR identifies RTL8685PB and states unsupported officially in2023; that is historical and not exact-model port proof. They link shantur/Three-4G-Hub-Firmware-Analysis, a possible source of same-family dumped libraries for analysis only.
https://github.com/shantur/Three-4G-Hub-Firmware-Analysis
https://www.ispreview.co.uk/talk/threads/three-4g-hub-sercomm-lte2122gr-modding-discussions.39724/

## Recovery tool static review
Tool: https://github.com/danitool/sercomm-recovery
Source: https://raw.githubusercontent.com/danitool/sercomm-recovery/master/sercomm-recovery.c
README supported list names AD1018 and untested H500-s/Vox2.5, not H300s. Its generic RESET/WPS boot sequence is NOT an H300s procedure. A later fork warns that some devices expect bootloader-containing images or headers removed; this increases the need for device-specific proof.
https://github.com/anphsw/sercomm-recovery

Static source review: main sends one HardwareInfo Ethernet broadcast using EtherType0x8888, reads hardware responses, and returns if no firmware filename was supplied. UpgradeStart/data writes/reboot are reachable through UpdateFW only when the firmware filename argument is supplied. A no-file probe could be a bounded discovery test for parent to consider separately, but no H300s responsiveness or recovery-entry method is established. Do NOT run the flashing branch and do NOT give it the vendor update image as though it were a raw recovery image.

Important negative same-SoC evidence: author shantur explicitly reports trying sercomm-recovery and finding it did not work on LTE2122GR despite similarity to H300s. This does not prove it fails on H300s, but defeats an assumption that shared SoC/manufacturer guarantees support.
https://www.ispreview.co.uk/talk/threads/three-4g-hub-sercomm-lte2122gr-modding-discussions.39724/

## Exact-model access and recovery limits
Primary Greek owners on ADSLgr say firmware-upload web interface was superuser-only through1.2.01.06. They discuss USB boot-time naming as an unanswered question, not a tested recovery method.
https://www.adslgr.com/forum/archive/index.php/t-1074686-p-101.html
Greek public credentials guide claims a pre-changed-superuser configuration restore method for newer builds, but this is not tested on1.2.02.08 and restoring another unit's configuration can overwrite unrelated settings. Parent's own older-default attempt was rejected; do not repeat it.
https://github.com/k-marios/Gr_ISP_Router_Firmware/blob/main/ROOT_PASSWORDS.md

Published OEM boot log proves U-Boot plus dual-image selection and UBI readvol on its example unit. It does not prove selectable emergency recovery or power-loss-safe firmware upgrades on this V3. U-Boot production CLI is disabled in that example. No UART-only bootloader command or RAMboot procedure can be prescribed from this evidence.
https://openwrt.org/toh/vodafone/vodafoneh300s

## Useful next evidence without opening or writing flash
- A passive Ethernet capture across a NORMAL reboot may reveal bootloader ARP/TFTP/0x8888 discovery traffic; it cannot itself validate recovery. This would require a planned user-approved reboot, not an invented reset-button sequence. No capture performed here.
- If firmware decoding succeeds, inspect stock upgrade/dual-image and boot-selection implementations before choosing image regions. Need verify signatures/checksums/hardware-ID checks and whether bootloader/calibration partitions are preserved.
- Before an experimental write: know exact update regions, maintain known-good alternate slot with verified selection/fallback mechanism, and demonstrate recovery using an appropriate stock image. Merely having two slots is insufficient.

## Explicit exclusions
- No other-model image recommended.
- No reset-button sequence asserted for V3.
- No known-current exact-model software vulnerability established. Search results for NetApp H300s CVEs concern unrelated server hardware; do not apply them to this router.

## Exact-model breakthrough superseding earlier search negatives
The current public edisionnano/Sercomm_Tools repository explicitly covers H300s and Speedport Plus. Its H300s README identifies latest H300s firmware1.2.02.08 and explains the hybrid Type1/Type2 firmware cipher, default XML cipher, and H300s double-encrypted backup format. Firmware/config specialists are independently testing actual supplied artifacts; do not equate README claims with successful local decode until their validation completes.

Immutable README revision: 60c2ffc05d3b0d20c1faaee2c77872fa147ed1a4, committed2026-10-20T22:27:44Z, message Add H300s info.
https://github.com/edisionnano/Sercomm_Tools/blob/60c2ffc05d3b0d20c1faaee2c77872fa147ed1a4/h300s_plus/README.md

The author reports a new Greek H300s superuser password recovered from decrypted default_GR.xml, distinct from the older public default already rejected on the user's router. The public credential is in the primary README; avoid confusing it with Turkish and OneNet variants. Parent notified to verify exact-model XML offline before any targeted attempt. No login attempted by this subagent.

The same README claims a Telnet configuration command-injection technique bypasses sc_cli on H300s and suggests flashing the exact-model1.2.02.08 debug image to enable Telnet. It provides no demonstrated H300s V3 recovery, rollback or power-failure procedure. Therefore do not turn that recommendation into a flash instruction. First obtain superuser access and inspect the current stock runtime/partitioning non-destructively. Root access would support unit-specific backups and make recovery investigation practical without opening the router; it still would not supply an OpenWrt port.

## Archive follow-up
Wayback CDX returned429 for both source-thread and MediaFire-pattern searches. The separate official availability API returned a confirmed200 snapshot of the Technopat thread at20220924231110. Retrieval of that snapshot returned429, so the original MediaFire URL was not recovered. Direct Technopat AMP request returned403. No claim the archive itself is unavailable; only this retrieval path was blocked.
Snapshot: https://web.archive.org/web/20220924231110/https://www.technopat.net/sosyal/konu/kaynak-kodlarindan-gpl-code-nasil-yazilim-dosyasi-cikarilir.2118655/
Availability query: https://archive.org/wayback/available?url=https%3A%2F%2Fwww.technopat.net%2Fsosyal%2Fkonu%2Fkaynak-kodlarindan-gpl-code-nasil-yazilim-dosyasi-cikarilir.2118655%2F&timestamp=20220819
