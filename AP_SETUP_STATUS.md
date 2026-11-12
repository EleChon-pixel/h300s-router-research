# Current access-point setup

## Verified during this session

- Main ZTE router: 192.168.2.1; DHCP pool 192.168.2.2 through 192.168.2.249.
- Main SSID HOME-MAIN is configured on both bands with the exact password supplied by the user. Password readback matched on both bands, and the user confirmed connection. No password is recorded here.
- H300s: 192.168.2.250, firmware Vodafone-H-300s-v1.2.02.08_debug, connected LAN-to-LAN to the main router.
- H300s DHCP is disabled. HOME-IOT and HOME-GUEST are enabled on both bands with WPA2/AES and their existing, distinct passwords. WPS is disabled.
- HOME-IOT internet access was confirmed by the user and by the laptop's current connection through it.
- H300s radio settings were changed to channel 6 / 20 MHz on 2.4 GHz and channel 36 on 5 GHz. Automatic channel reselection is disabled. Saved settings, SSIDs, passwords, enable states and guest isolation were checked after this change.
- Guest AP isolation is enabled on both bands. No temporary test timer is pending.

## Unresolved guest failure

- A guest client associated but received a self-assigned 169.254 address.
- A corrected temporary test with guest AP isolation disabled, all four SSID enable switches explicitly included, still did not obtain DHCP.
- The user also reported that a temporary manual address did not provide access to the main router.
- These observations establish that the current guest path does not provide connectivity through this LAN-to-LAN setup. They do not establish that every possible stock-firmware configuration is unsupported.
- Full guest or IoT isolation from the main LAN has not been established. An extra SSID or AP-isolation flag alone must not be reported as that result.

## Configuration hazards established during setup

- H300s wifi_general writes must explicitly include all four primary/guest enable switches. Incomplete writes disable omitted networks. configure_access_point.write now enforces this guard.
- The ZTE WLAN form requires _PSKCONIG=Y to apply a WPA passphrase update, plus its encrypted password envelope, Check header and correctly decoded page token. A successful response alone does not establish that a password changed; perform authenticated readback.
- Every radio update can restart broadcasts. Wait for an actual scan before claiming availability. Avoid changing the working main ZTE during further H300s work.

## Routed alternative (superseded, see "Routed mode applied" below)

- The privileged H300s WAN form includes DHCP as a connection type and submits wan_data_list with edit_id_list and del_id_list.
- Existing profile 11 is EthernetData, PPPoE, VLAN 835. Profiles 12 and 13 are Ethernet DHCP for voice and IPTV, with provider VLANs.
- A possible migration would use untagged Ethernet DHCP for the data uplink, a separate H300s LAN subnet, and DHCP only on that separate LAN. It requires a physical move to the H300s WAN port and an explicit management/recovery path during migration.
- This candidate has not been applied or validated. Guest internet access and restrictions against the main LAN would require separate checks; NAT alone is not an isolation guarantee.

## Offline firmware inspection

- Extracted exact-version librcl.so SHA256: 56f1d173b8d0c3bac8fff5dbd03cd551dbcd01d966d3c49f0cc206ad0ac2c678.
- REA file-header evidence parent: ev_c525cfcbfbb74569b1371a96b2e8fdf7a6f1e8e4e447f7138bdbbb2d3f982a93.
- Ordinary shell inspection found exported guest management firewall routines and kernel guest-interface handling. These static observations do not prove live forwarding behavior.
- Native decompilation providers are unavailable; the configured host has a MIPS objdump for bounded disassembly. No analysis engine was installed.

## Routed mode applied (2026-11-12, ~16:10 local)

- Physical: ZTE LAN -> H300s WAN port. Laptop enp44s0 -> H300s yellow LAN port (management).
- Encrypted pre-migration backup: unit-backups/20261112T141056391186Z-pre-routed/before-routed.config (password not saved).
- H300s LAN: 192.168.3.1/24, DHCP enabled, pool 192.168.3.100-192.168.3.199, DNS 192.168.3.1.
- WAN profile 11 EthernetData: untagged (VLAN 0) DHCP, NAT on; status Connected, got 192.168.2.29 gw 192.168.2.1 from the ZTE.
  Profiles 12/13 (voice/IPTV, VLAN 837/836) untouched and Disconnected.
- migrate_routed.py --apply completed every step; its final "No route to host" came from the status poll after the
  LAN restart, not from a failed step. Read-only check: `python3 migrate_routed.py --target 192.168.3.1`.
- Verified from laptop over Ethernet: DHCP lease 192.168.3.100, DNS via 192.168.3.1 resolves, traceroute
  192.168.3.1 -> 192.168.2.1 -> internet, HTTP to 1.1.1.1 works.
- Not isolated from main LAN: an H300s-LAN client reached the ZTE admin page (192.168.2.1) through NAT. Main-LAN
  devices cannot initiate connections into 192.168.3.0/24.
- Guest APs (2 and 6) keep X_SC_APIsolate=1. User confirmed 2026-11-12: phone joined HOME-GUEST and has internet.
- Laptop NM profile H300s-investigation is temporarily (--temporary) DHCP, never-default; reverts on NM restart.
- Stale helpers still running from the Codex session: local-router-access proxy on 127.0.0.1:8080 (points at old
  192.168.2.250) and main_router_dhcp.py.

## Guest -> main LAN isolation research (2026-11-12, not applied)

- Leftover Codex helpers (8080 proxy, main_router_dhcp.py) stopped.
- No root shell exists, so custom iptables is out.
- rcl_fw_start_nat adds FWD_NAT_WAN "-d 10/8, 172.16/12, 192.168/16 -j DROP" only when helper 0x276c0 (is-private-IP check
  on the WAN address) returns 0. Our WAN is 192.168.2.29 (private), so those drops are skipped; no setting controls it.
- Viable path: hidden-but-shipped IP Filter page (internet_page/internet_ip_filter.html, menu id ip_filter).
  POST /data/internet_ip_filter.json with internetIpFilterDatalist = JSON list of
  {id:"0",type:"ip_filter",name,protocol:tcp|udp|tcp_udp,source_start/end_address,destination_start/end_address,
   outgoing_interface:"all"|<id from internet_ip_filter_interface.json>,status:accept|reject}.
  Backend: rcl_fw_start_ipfilter -> FWD_IPFILTER with iprange src/dst. Live endpoint not yet read (cable unplugged mid-check).
- Guests and HOME-IOT share one pool (192.168.3.100-199), so a rule by source range covers both unless ranges are split.

## LG TV on HOME-IOT -> Jellyfin tunnel on laptop (2026-11-12)

- Laptop user unit ~/.config/systemd/user/jellyfin-tv.service: ssh -L 192.168.2.6:18096 -> homeserver (tailscale
  <tailscale-ip>) 127.0.0.1:8096. Changed Restart=no -> on-failure (RestartSec=15); backup at .service.bak. Running.
- TV moves from HOME-MAIN (old UFW allow from 192.168.2.8) to HOME-IOT; H300s NAT makes it arrive as 192.168.2.29.
  User must add: sudo ufw allow in on wlo1 from 192.168.2.29 to 192.168.2.6 port 18096 proto tcp comment "LG TV via H300s"
- Planned H300s changes (need management link): static DHCP lease for TV MAC; IP filter rule 1 accept TV IP -> 192.168.2.6
  (filter has no port fields), rule 2 reject 192.168.3.0/24 -> 192.168.2.0/24. Rule order must be verified live.
- Dependencies on ZTE leases: laptop 192.168.2.6 (hardcoded in unit) and H300s WAN 192.168.2.29 (UFW). Reserving both on
  the ZTE is recommended; not done.

## Applied 2026-11-12 (~evening): TV lease + main-LAN block (tv_isolation.py)

- Static lease LGwebOSTV 02:00:00:00:00:02 -> 192.168.3.102 (settings_lan LanStaticDHCPList). Write bounces LAN ports ~9s.
- IP filter (POST internet_ip_filter=<json>; success reply is "[ ]", verify by readback):
  1. TV-Jellyfin accept tcp 192.168.3.102 -> 192.168.2.6
  2. Block-main-LAN reject tcp_udp 192.168.3.2-254 -> 192.168.2.1-254 (ICMP not covered)
- Verified from laptop wired (192.168.3.100): internet + DNS OK; 192.168.2.1 times out. With a temporary accept rule
  above the reject, 192.168.2.1 was reachable -> list order = evaluation order.
- Rollback: python3 tv_isolation.py --rollback-filter
- TV -> laptop:18096 end-to-end not yet verified; depends on user's UFW rule allowing 192.168.2.29.

## Done 2026-11-12: UFW + ZTE reservations

- Laptop UFW: allow in on wlo1 from 192.168.2.29 to 192.168.2.6 port 18096/tcp ("LG TV via H300s"), added via pkexec.
  Old 192.168.2.8 rule deleted after user confirmed Jellyfin works on the TV via HOME-IOT (2026-11-12).
- ZTE DHCP bindings (dhcp4s_dhcpbinding_m.lua): H300s-WAN 02:00:00:00:00:04 -> 192.168.2.29 (Bd1),
  laptop 02:00:00:00:00:01 -> 192.168.2.6 (Bd2). Read back verified. ZTE Wi-Fi untouched.
- ZTE POST format for _m.lua forms: IF_ACTION=Apply&OBJ_<OBJ>._OBJ_InstID=-1&OBJ_<OBJ>.<Field>=...&_sessionTOKEN=<page token>
  with Check header (see recover_main_wifi.ZTE.request). Plain field names -> HTTP 404.
- No terminal for sudo/getpass in the agent shell: use pkexec, and zte_login.py (zenity dialog) -> session cookie file,
  reused by zte_session.py; `python3 zte_session.py --logout` deletes it.
- User declined changing the H300s admin password (factory superuser still in use; scripts rely on it).

## 2026-11-12: guest PSK, backup, ZTE security review (read-only)

- HOME-GUEST PSK set to the same value as HOME-MAIN on both bands (user's explicit choice, aware guests could then join
  HOME-MAIN). set_guest_password.py; readback verified, other wifi_general fields unchanged; all 6 SSIDs broadcasting.
- Backup: unit-backups/20261112T150502Z-routed-final/routed-final.config (encrypted, decrypt verified, pw not saved).
  backup_h300s.py (zenity prompt when no tty).
- ZTE findings: HOME-MAIN BeaconType WPAand11i + TKIPandAES (WPA1/TKIP allowed) -> recommend WPA2-AES (or WPA2/WPA3).
  UPnP on; all mappings are tailscale-portmap (41641) for .7/.14/.19/.20 -> keep (tailscale/Jellyfin tunnel benefit;
  HOME-IOT can't reach 192.168.2.1 anyway). Firewall Level Middle, AntiAttack+DoS on, DMZ off, DDNS off,
  login timeout 10 min, IPv6 on. No IPv4/IPv6 service-control rules (defaults). WPS not exposed in web UI.
- External exposure test via ProtonVPN inconclusive: Proton accepts every TCP port (even random ones) but no HTTP
  page / SSH banner came back. Verify from a phone on mobile data: http://<public-wan-ip> should not load.
- User declined the HOME-MAIN WPA2/WPA3 change (2026-11-12); TKIP mixed mode left as is.
- User verified from phone on mobile data: http://<public-wan-ip> does not load (ZTE admin not exposed). Setup complete 2026-11-12.
