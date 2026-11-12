# H300s investigation

Unit-reported: hardware V3; firmware Vodafone-H-300s-v1.2.02.08; web UI bootloader version 1.01.1.

## Backup observations
- Original preserved as original.config, with mode 0600 in directory mode 0700.
- SHA256: 5ae3325df9a7cc37a1718547a7da5ee9c5f2449b9acea7e35b8e0f83dccca37a
- 41370 bytes; five-line plaintext header of 138 bytes; 41232-byte binary payload.
- User confirms choosing an export password. No password stored in these artifacts.
- No validated embedded zlib streams. Generic sercomm_cfg_unpacker format does not match.
- 18 common unsalted AES CBC/ECB hypotheses tested in memory; no validated zlib decompression. This is not proof of an incorrect password or exclusion of AES.
- Not decrypted; not validated for restoration; not a flash backup.

## Archived firmware
Downloaded Vodafone_H_300s_v1.2.02.08.img from k-marios/Gr_ISP_Router_Firmware for offline analysis only.
- Size: 20709840 bytes. SHA256: 02ba28299a7e72541d352b066deffd1796d252d4e070a518c5163309e37e85b1
- Git blob SHA1: 23fcb8a9bb114707168048330121a1c23bc4963a; matches GitHub contents metadata. This checks repository consistency, not vendor authenticity or V3 flash compatibility.
- Initial header contains version 1.2.02.08 and ASCII size 20709664, which equals file size minus 176.
- Basic signature searches found no SquashFS, UBI or ELF markers. A gzip signature candidate failed decompression. Encryption is a hypothesis, not established.
- REA firmware scan unavailable: caller-supplied Binwalk is not configured. No packages installed.

## Source leads and limitations
- https://github.com/r3d5ky/sercomm_cfg_unpacker/blob/main/cfgtool.py : inspected source; zlib at offset four; does not match backup.
- https://github.com/k-marios/Gr_ISP_Router_Firmware/tree/main/Vodafone/Retail/Sercomm/H300s : exact version filename exists; debug-labelled files also exist but were not downloaded or flashed.
- https://github.com/alexytomi/RTL8685 : contains uClinux-dist. Recursive subtree inventory was truncated; limited filename search did not identify Sercomm config handlers. Exact H300s applicability unestablished.

## Next evidence needed
Inspect the H300s web UI export implementation and JavaScript, or obtain matching vendor GPL/SDK including config crypto libraries. Establish which local interface reaches the isolated H300s before any live read. Capture a unit-specific UART boot log only after identifying board pins and logic voltage.

Router unchanged. No firmware executed or flashed. No backup uploaded.

## Offline follow-up (2026-11-11)

User confirms laptop is not connected to H300s. No live router queries attempted.

### Firmware wrapper
- Firmware has a 160-byte, five-field wrapper resembling published Sercomm image formats: 32-byte leading field, version, key/IV-related field, fourth field, decimal size.
- Correction after byte-indexed inspection: fourth field (bytes 96-127) IS all zero. The 04 byte is byte 95, in the preceding field. Header satisfies the published Type1 null-field checks; decoding still did not yield recognizable contents.
- Decimal size is 20709664; ciphertext after byte 160 is 20709680 bytes, consistent with 16 bytes of block padding, but this alone does not prove AES or the plaintext format.
- Tested upstream OpenWrt sercomm-crypto MD5-based key derivation with candidate CBC offsets/IVs. No recognizable filesystem output.
- Tested 18 variants based on published Type1/Type2 routines (padded/unpadded version and IV placement). No expected prefix magic found. These were signature checks, not cryptographic proofs of failure.
- Tested 18 variants using a static key reported for a DIFFERENT Vodafone device, including hash-derived variants. No ELF, UBI or SquashFS markers found. Cross-model format compatibility is unestablished. No candidate output retained.
- Sources: https://github.com/openwrt/openwrt/blob/main/scripts/sercomm-crypto.py and https://github.com/Psychotropos/sercomm_fwutils/blob/master/image_types.py

### Source-package search
- Retrieved nonrecursive RTL8685 SDK root index and complete user subtree index (user subtree reports truncated=false). Root includes linux-2.6.x, u-boot, vendors and user. User tree includes Boa configuration handlers. No filename hits for Sercomm, libsex or fwutil in the complete user subtree; filename search does not exclude differently named code.
- Repository is not established as H300s source or a complete buildable SDK. Direct kernel Makefile fetch returned 404. Do not infer the actual kernel version from its directory name alone.
- First-person H300s source-release lead: R065-A-2022-0022, described as firmware 1.2.00.09 source supplied after a Vodafone request. Archive not obtained. A later participant reports the historical MediaFire link dead. This is a lead, not verified source contents.
- Lead URL: https://www.technopat.net/sosyal/konu/kaynak-kodlarindan-gpl-code-nasil-yazilim-dosyasi-cikarilir.2118655/

### Practical next routes
1. Obtain exact-model GPL/SDK archive or extracted H300s root filesystem from an independently documented source. Prioritize libfwutil.so, libsex_crypt.so, libcfg.so, setup.cgi, dualImage_ctrl, board config and Ethernet/NAND BSP. Names are leads from related Sercomm research, not confirmed H300s files.
2. Obtain H300s-specific firmware wrapper implementation before further broad key guessing.
3. Once firmware is extractable, inspect encryption and backup handlers before revisiting the user-supplied password. No password persisted in investigation files.
4. Preserve recovery-first boundary. Archived update image is not a unit-specific NAND backup; dual images do not establish recovery from bootloader/calibration damage.

## Further independent investigation (2026-11-11)
- Complete public firmware archive tree retrieved (truncated=false). H300s retail and OneNet update files exist; no paths containing GPL, source, or R065 were returned by the filename filter. This does not exclude source stored under unrelated names or elsewhere.
- Older retail firmware downloaded for offline comparison: older-stock-research.img, version 1.0.09.01_dsp190325T006, 19661264 bytes, SHA256 1fbc9fd88a45fb48d6672283c3e39bfacc34cdb7fd01d676fec51cdae9dd4928. Type1 decrypt yielded no UBI/SquashFS/ELF markers.
- Debug-labelled current image downloaded for offline comparison: current-debug-research.img, internal version 1.2.02.08_debug, 20709840 bytes, SHA256 13f388201a09800b79e32aa634fa229d32831dfeda16e4d7d8bb3c3971f0bd4d. Different payload from release; no UBI/SquashFS/ELF markers in original file. No inference of unlocked access from debug label. Not flashed.
- Additional bounded header-key hypotheses (1892 keys) tested against selected plaintext prefix offsets; no recognizable gzip/UBI/SquashFS/ELF prefixes. This limited check does not exclude compressed/custom plaintext.
- Physical route lead: H300s owner reports direct SPI NAND extraction from Macronix MX35LF1GE4AB in https://reverseengineering.stackexchange.com/questions/33585/is-my-flash-dumped-properly . Their dump quality is questioned; this is evidence of hardware investigation, NOT a validated programmer recipe or the chip fitted to user V3.
- Independent next route: unit-specific board identification, receive-only UART boot capture, then verify whether a stock login or supported read-only export path permits NAND and filesystem capture. If not, plan external NAND acquisition with verified chip geometry, ECC/OOB policy and restoration method. Do not copy NOR programmer procedures to NAND.

## Unit web-script evidence
Input Downloads/H300s-web-scripts.txt contains three successful HTTP 200 responses. Sources extracted privately under web-scripts/.
- mainFunctions.js:58: actual user_data GET includes timestamp and csrf_token. Bare URL failure may be explained by missing token, but no HTTP status was captured for that failure.
- mainFunctions.js:64-87: loads usermode, userprofile, debug_fw and feature flags.
- mainFunctions.js:128-136: forces ordinary display mode to expert; admin mode separately selected when usermode equals admin. This UI role must not be equated with Linux root.
- mainFrame.js:9-58: ordinary expert menu has configuration but no firmware-update entry.
- pageLoadFunctions.js:82: references page_settings_fw_update_load(data). Implementation absent from the three captured scripts. Existence of reference does not prove endpoint availability, authorization or image acceptance.
Next read-only evidence: settings.html and settings-specific script resources referenced by that HTML, plus selected existing role globals. No POST, role changes or firmware uploads authorized by this inspection.

## Settings export
Downloads/H300s-settings-scripts.txt: settingsStatus=200, /js/settings.js HTTP200, 10142 characters. mode/profile absent from output, so those globals were unavailable in the shortcut context; do not infer account role.
settings.js lines 68-73: sub=59 loads settings_page/settings_fw_update.html and js/settings_fw_update.js. mainFrame.js ordinary-menu whitelist omits sub=59, so direct hash navigation may be redirected. Other source-derived paths: js/settings_configuration_enduser.js, js/settings_configuration.js, js/settings_access_control.js. Next inspect firmware HTML/JS and backup JS with GET only. No update handler executed or image submitted.

## Update/access-control script export
Input Downloads/H300s-update-scripts.txt: four HTTP200 JavaScript resources.
- settings_fw_update.js:144-149 builds multipart POST /data/settings_fw_update.json, uploadType=image and uploadedfile file field.
- settings_fw_update.js:200-203 appends CSRF token then submits only after install/confirmation handlers. No upload performed.
- settings_fw_update.js:219 client checks filename extension img. This is NOT evidence of permissive backend image checks or accepted modified firmware.
- settings_fw_update.js:14-17 reads update_status, update_msg and fw_version from GET data via page_data_load.
- settings_access_control.js:44-67 reads /data/settings_access_control.json and ssh_status/ssh_lan fields. This is UI support only; server field availability, actual SSH listener and shell access remain unknown.
- settings_configuration.js:1204-1214 passes chosen export password to server and downloads /data/Backup.json following success. Does not implement backup cipher client-side.
Next: authenticated GET of existing UI data endpoints using page token, reporting allowlisted role/status fields only. Do not POST, enable SSH, upload an image, restore config or interpret HTTP200 script availability as backend authorization.

## Authenticated read-only status results
User-provided phone capture H300s-status-check.txt:
- user_data HTTP200: usermode=user; userprofile empty; debug_fw empty.
- settings_fw_update HTTP200: update_status=0, update_msg=0, fw_version=Vodafone-H-300s-v1.2.02.08. Current ordinary session can read update status; write authorization remains untested.
- settings_access_control HTTP200: ssh_lan=deny, ssh_status=0. Firmware reports SSH disabled/denied on LAN; no live port probe made.
- Script found page token successfully; token not included in output. No settings changed.

## Access-page capture
H300s-access-pages.txt: settings_fw_update.html HTTP200 but zero-length body; request omitted CSRF token. Cannot distinguish role filtering from missing-token handling. settings_access_control.html HTTP200 with 11057 characters, no SSH markup, only icmp/http/tr069 WAN and LAN selects. Contains an inline CSRF token; keep raw template private and do not reproduce token. settings_password.js HTTP200: admin-mode branch handles username/user_id account list; user branch handles auto_logout. No confirmed server-side authorization bypass. Next bounded check: GET firmware template with page token as implemented by settings.js; no execution of returned markup and no POST.

## Direct Ethernet investigation
Created NetworkManager profile H300s-investigation (autoconnect=no, IPv4 DHCP, never-default=yes, ignore-auto-dns=yes, route-metric=3000, IPv6 disabled). Activated on enp44s0; DHCP address 192.168.2.3/24. Wi-Fi remains 192.168.2.6/24 with default route via 192.168.2.1 metric600. Both routers retain 192.168.2.1, so EVERY router request must explicitly bind enp44s0. No forwarding enabled and no router settings changed. Ethernet neighbor MAC 02:00:00:00:00:03 matches user-reported H300s.
HTTP GET / returns meta refresh to login.html; retrieved login.html and login.js without credentials. Login JS uses challenge-dependent password SHA256 and CSRF; no credentials attempted. Session files contain ephemeral cookies/tokens and remain in private investigation directory.

## Local inspection proxy login repair
Initial proxy blocked all POST except /data/login.json. Source inspection pageLoadFunctions.js:131 proves login dataBatchSend first POSTs /data/reset.json with only chk_sys_busy. This prerequisite was incorrectly blocked. Proxy now permits exactly that sole-field busy check, plus login API, while blocking all other POST paths and multipart uploads.
During verification enp44s0 profile was found disconnected; reactivated H300s-investigation. Verification through loopback URL: login page read succeeded, busy-check HTTP200, reset-request HTTP403, upload-request HTTP403 (both rejected locally, not forwarded). User credential authentication remains unverified and must not be reported successful. Proxy running session 10078 on 127.0.0.1:18080.

## Authenticated direct inspection verified
Browser session successfully reused in process memory after preserving User-Agent/Accept-Language, AJAX request header and timestamp format. No credentials or session cookies written by the inspection path. Separate requests without these headers previously failed; exact server predicate not isolated.
- user_data: HTTP200, username not requested; usermode=user, blank userprofile/debug_fw.
- settings_password: HTTP200, account username=admin, user_id=3, auto_logout=501015. Other response field names include pwd/email/login_without_password; values intentionally excluded. No account list or superuser credentials obtained.
- settings_fw_update GET: HTTP200, 181 bytes. Status/version readable; other field names ram_size_check, usb_status, usb_fw_file. No write acceptance tested.
- settings_configuration GET: HTTP200, 466 bytes; metadata field names only exported; no backup/config changes.
- firmware template GET with authenticated Cookie, browser headers, timestamp and CSRF token: HTTP200, zero bytes. Therefore missing-token explanation no longer accounts for this capture. Role filtering or stub remains possible; exact implementation unknown. Merely adding a menu is not an established privilege bypass.
- Local proxy remains inspection-only: POST login and exact chk_sys_busy status allowed; all other POSTs/multipart blocked. It listens only on 127.0.0.1:18080 and stores session cookies only in process memory. Current process session 64726.
Connectivity and authenticated status inspection established. Required before flashing: a verified compatible payload, write authorization, and recovery method. None of those three has been established.

## Single documented legacy-superuser check
Performed one challenge-based superuser login using the publicly documented older-firmware default, in a separate transient HTTP client with cookies only in memory. GET challenge succeeded, busy check did not report busy, POST login returned HTTP200 with code3. Captured login.js maps code3 to password rejected. No repetition, password changes, resets or firmware uploads. This rules out that exact credential attempt under this session; it does not establish whether the account is disabled or has a different password.

## Delegated investigation breakthrough (2026-11-11)
Three requested agents independently investigated firmware, backup, and recovery.
- Exact-model primary source: https://github.com/edisionnano/Sercomm_Tools/blob/60c2ffc05d3b0d20c1faaee2c77872fa147ed1a4/h300s_plus/README.md
- Firmware decoder now validated for current release, current debug and older release images. Proper UBI logical-volume reconstruction required before SquashFS extraction. See firmware-analysis/REPORT.md and decode_h300s.py.
- Validation includes AES padding, UBI EC/VID CRCs, U-Boot kernel header/data CRCs, gzip integrity and default XML parsing. No update footer/signature acceptance established.
- Current release/debug extracted regular files available; unsafe/absolute symlinks skipped by7z, so extracted tree is static-analysis material, not directly bootable.
- Exact1.2.02.08 default_GR.xml decrypted and XML validated. Current release/debug default plaintext identical SHA25620baf9c507c17e3d58d1072b2289f84886a72a70e5af653bcc38bf761114acdb. Existing current Greek factory superuser credential recovered; no password reset needed.
- User original config backup decrypted with supplied export password. Both AES layers valid, XML20602 bytes275 elements. In-memory reencrypt exactly reproduces original backup byte-for-byte. See config-analysis/RESULTS.md. Plaintext contains only account3 password overlay and is not a full recovery backup.
- One targeted login using exact-firmware recovered default ACCEPTED: HTTP200 login code1. Post-login user_data reports username=superuser, usermode=admin, settings_password user_id=1. Firmware-page GET now2018 bytes with upload container. See exact-default-login-result.json. No settings, credentials or firmware changed; authentication changes current web session.
- Generic Sercomm recovery not verified for H300sV3. No compatible OpenWrt image or reliable stock recovery procedure established. No flashing authorized by evidence yet under user's recovery-first constraint.
- Static MIPS library inspection: libfwutil.so contains exported write_mtd/swap_active_rootfs/get_active_bootld_mtd and crypto routines. REA native decompilation unavailable: no configured Ghidra and verified target ABI lane limitation; no host software installed to work around this. Native session should be closed after evidence inventory.

## Session 2026-11-12 — restore path + CGI command-exec audit (offline, REA/objdump)
Environment note: REA decompiler providers (Ghidra/rizin/IDA) are NOT configured on this host
(same wall as prior session). All analysis below is mips-linux-gnu-objdump + a GOT/xref resolver
built this session. No router interaction. No live queries. No config/firmware changes.

### Config restore is DESTRUCTIVE (rcl_restore_cfg @ librcl.so 0x3d478), confirmed
Resolved call sequence of rcl_restore_cfg via MIPS GOT resolution:
  cm_value_get x10 (read restore metadata) -> cm_config_default()  [FACTORY RESET]
  -> cm_config_import(uploaded_file) -> cm_value_set x10 (re-assert fixed values).
Implication: a config "restore" wipes current config to defaults then imports, and sets
X_SC_RebootCause=WebRestoreConfig (reboot). Using restore to enable SSH would factory-reset
the unit. cm_config_import lives in libcml_api.so (not yet reversed for scope enforcement).
Combined with the export-scope fact below, this path is NOT a safe SSH-enable route.

### Backup EXPORT scope excludes the SSH/Firewall subtree, confirmed
Decoded config.xml (config-analysis/decoded/config.xml) is a FULL TR-069 datamodel dump
(128 OBJECTs / 146 PARAMETERs), NOT a delta. Top-level subtrees present: USB, DeviceInfo,
Services(VoIP SIP), ManagementServer(TR069), WiFi, IP, Routing, LANConfigSecurity, Hosts,
DNS, DHCPv4. ABSENT: Device.Firewall.* and Device.X_SC_Management.SSHServer.*.
=> SSHMode/SSHServer are outside the backup/restore datamodel scope in the observed sample.
(NB: the earlier structure-summary.json "account_objects only" was a narrow login-account filter,
not the true file scope. The file contains live SIP/TR069 credentials — keep private.)

### setup.cgi command-execution audit (77 system()/SYSTEM() sites)
Shared input sanitizer identified: util_Valid_ShellStr() @ libutility.so 0x11688.
It is a strict WHITELIST (strchr against allowed set), allowed chars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_-.: "
No shell metacharacters pass. Confirmed negatives (NOT injectable):
  - /bin/ping "%s" (0x4382a8): host gated by scIsIpAddress OR scValidIPv6 OR
    (util_Valid_ShellStr + gethostbyname), and double-quoted. Closed.
  - insmod capture.ko ... remote_ip=%s (pcap diag): remote_ip = getenv("REMOTE_ADDR")
    (client TCP source IP, server-set, not user content); ifname is internal. Closed.
  - Majority of sites are constant commands (/usr/sbin/rc *, ifconfig, iwpriv, rm/cp of
    fixed paths) or numeric %d args. Not injectable.
Remaining UNAUDITED %s-with-possible-request-data candidates (need per-site disasm):
  - /bin/echo "%s" >/var/fw_name (0x4123a8)   [source unknown; double-quoted file write]
  - /usr/sbin/rc usb_mount stop "%s" (0x4333b0), /usr/sbin/rm /tmp/uxx_s/"%s" (0x4333cc)
    [%s = USB volume label; likely physical-USB vector, not web]
  - fully-dynamic SYSTEM(reg) sites: 0x4389d4, 0x43b8f8, 0x43cda8
  - ~13 plain system(reg) sites whose command buffer my scanner could not resolve:
    0x413ca0 0x416adc 0x437038 0x43bd88 0x444118 0x44489c 0x4450f8 0x445870 0x4460cc
    0x446844 0x446ef4 0x44aaf8 0x44b44c

### Generic config endpoints (lead, not yet reversed)
/data/api_set_cmd.json and /data/api_get_cmd.json exist in setup.cgi but are referenced by
NO web UI JS/HTML (internal/engineer/TR069-style). If api_set_cmd allows an admin session to
write an arbitrary datamodel key via cm_value_set, it could set
Device.Firewall.X_SC_AccessControl.SSHMode=lan WITHOUT the _debug gate and WITHOUT reboot/reset.
Reachability, auth requirements, and key scope are UNVERIFIED. This is the top remaining
non-destructive SSH-enable candidate to investigate next.

### Note on SSH usefulness even if enabled
sshd_config: PermitRootLogin no; /usr/sbin/login -> sc_cli (restricted). Enabling stock sshd
may land in sc_cli, not a root shell. An authenticated command-injection running as the CGI
user (root) would be strictly more useful (NAND dump, telnetd -l /bin/sh, backups).

## Resume 2026-11-12: user notes incorporated and admin export
Read user's added restore/CGI audit and preserved modified local proxy. Ethernet profile was disconnected; reactivated existing H300s-investigation (local only, no default/DNS change). Old authenticated proxy session expired.
Created session-snapshot.py: explicit Ethernet binding, transient cookies only, exact verified default login, GET allowlist and three POST shapes only (login, chk_sys_busy, ConfigurationSaveType=computer export). No restore/service-enable/firmware-write capability. Initial automatic approval review timed out; one retry approved.
Stock export generation returned success. /data/Backup.json uses a302 to router-local /download/; helper follows only same-origin /download/ GET. No generic external redirects.
Fresh superuser export: unit-backups/20261112T012015Z/superuser.config, groupadmin,46420bytes, SHA256d2395158269dc9fe2861dd0be0160346538da5892e6f86ecb4705ede580d95c9. Both layers decrypted and XML parsed,23108plaintext bytes303elements. Files0600. No password saved. No configuration restore or firmware upload.
Live role remains superuser/admin, firmwareVodafone-H-300s-v1.2.02.08. SSH reportsstatus0 andLANdeny/WANdeny.
Admin export contains additional Host2/Host3 paths versus original capture, consistent with later connected clients; it does NOT add SSH/Telnet or firewall objects. Therefore groupadmin does not establish full-scope configuration export or flash recovery.
Source sc_cli: stock passwd_file rootuid0 shell/bin/sh with empty template field, but runtime credentials not checked; must not infer empty runtime root password. vty_command at0x403d4c calls getFwVersion then strstr(_debug) before shell-prefixed handler. This reinforces stock restricted CLI limitation; no live shell login attempted.
Delegated API audit in progress independently finds genericapi_get_cmd/api_set_cmd only in auth-exemption string list, not dispatcher. NormalSSHPOST handler gated byadmin andversion_debug; generic response1 does not proveSSHfields applied. Await saved detailed evidence.

## Resume audit completion
Fresh existing-systemlog export from /Syslog.json (stages sorted currentlogs, not DSL diagnostics) saved unit-logs/20261112T013204Z,67060bytes1194lines; no kernel/U-Boot/MTD/NAND/UBI terms. Existing authenticated source session could be reused through overview when loginpage redirected; helper now handles this without more password attempts. No firmware/config restore performed.
Delegated API audit complete in api-analysis/API_FINDINGS.md and DOWNLOAD_PATH.md: generic routes unregistered; SSH writes gated_debug; syslogexport legitimateexistinglogs; DSLdiagnosticsactivegenerator avoided.
Delegated updater audit complete in firmware-analysis/UPDATE_RECOVERY.md: all3payloadRSA-SHA256 signaturesvalid; same archivedCS9/A001 target; writesinactivebank+checksum then sharedmtd2 bootflag. No observedbootloaderwrites in normal path. Sharedflag rewrite erasespartition, so powerlossatomicity/automaticrollback unproven. Parent independently ran hostopenssl on debugcandidate ->VerifiedOK. FullNANDbackup/livePID/bootloaderrecovery remain unavailable.
FLASH_READINESS.md captures met/unmet checks and preserves user's original recovery-first constraint. No signedmodifiedOpenWrt image exists from this work and noflashperformed.
