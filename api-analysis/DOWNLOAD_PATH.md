# Offline audit: H300s stock download paths

Evidence: exact extracted Vodafone-H-300s-v1.2.02.08, setup.cgi and mini_httpd disassembly in this directory. No router requests, uploads, settings changes, or flash operations were performed.

## Result

No concrete arbitrary-file download mechanism has been established. In particular, ordinary or percent-encoded parent traversal through `/download` does not establish access to `/proc/mtd`, `/dev/mtd*`, or `/tmp/fw_info/fw_ver`. The server decodes and removes traversal components before filesystem resolution. Existing export handlers have fixed source files and generated output names.

## Static serving

The SquashFS archive identifies `usr/www-ap/download` as a symlink to `/tmp/httpdownload` (verified by `7z x -so .../rootfs-reconstructed.squashfs usr/www-ap/download`). This provides access to files prepared in that staging directory, not an unrestricted root directory alias.

mini_httpd path processing:

- Percent decoder at `0x403978` is invoked in place at `0x4076b8`.
- Leading `/` is required and then stripped at `0x4076c0–0x4076dc`.
- Repeated slashes and dot components are removed at `0x4076f4–0x4079a4`.
- Literal strings at VAs `0x40b394`, `0x40b41c`, `0x40bb7c`, `0x40bb80`, `0x40bb84`, `0x40bb8c` are `//`, `./`, `/./`, `../`, `/../`, `/..`.
- Remaining absolute paths or leading parent components reach the `Illegal filename.` error (`0x4079b4–0x4079c4`, `0x407cd8–0x407d14`).
- `stat` is invoked on the resulting relative pathname at `0x407a74`.

Therefore `/download/../../proc/mtd` is normalized before the kernel follows the download symlink. It does not mean “resolve download symlink, then walk upward.” Encoded separators/dots are subject to this normalization after decoding. No second decode in the static serving path has been established. This is not an exhaustive proof against all server bugs or symlink races; it rules out proposing simple traversal as an evidence-backed backup path.

## CGI export preparation

Function `0x412884` dispatches a fixed list of URI substrings, creates staging files, and redirects to `/download/<generated-name>`. For example:

- `/html/engineer/dnscache.json`: source `/tmp/var/dnsmasq.cache.log`.
- `/html/engineer/routeinfo.json`: source `/tmp/route_list.txt`.
- `/Syslog.json`: invokes `create_sort_log2file`, then copies `/tmp/sort_log/general.txt` to a generated staging filename.
- Configuration backup uses `rcl_backup_cfg` and encryption rather than a user-selected source pathname.

The DNS/route filename helper at `0x412558` receives time and `getFwVersion` output. Source/destination copy format `/bin/cp -f %s %s` is at VA `0x44f518`, destination format `%s/%s` at `0x44f80c`, redirect format `/download/%s` at `0x44f548`. This path is not a demonstrated way to choose an arbitrary source path.

## DSL debug export: active diagnostic operation

Frontend file `usr/www-ap/statusandsupport/dsl_debug_log.html` constructs `DSL_Debug_Log.json?_=<timestamp>&csrf_token=<token>` on its Download button. The exact CGI branch is `0x4130c4–0x41327c`:

1. Calls `COMMAND("/usr/bin/killall -SIGUSR1 debug_agent")` at `0x413114`.
2. Sleeps two seconds and requires `/tmp/debug/dsl_debug_messages` to exist.
3. Opens `/tmp/fw_info/fw_ver` with mode **r** at `0x413144`; `fgets` at `0x41315c`, close at `0x41317c`. This reads the version to construct the archive name; it does not modify the SSH debug gate file.
4. Moves the DSL debug directory into a generated directory, creates a gzip tar in `/tmp/httpdownload`, moves logs back, and removes temporary contents. Commands at strings `0x44f7fc`, `0x44f820`, `0x44f844`, `0x44f85c` confirm these effects.

An equivalent code sequence appears around `0x44c104`.

This endpoint is **not a passive read-only snapshot**: it signals a daemon and moves/cleans diagnostic files. The exact stock rootfs contains no file named `debug_agent` (`rg --files`), so its collection behavior and availability cannot be verified from that executable here. No evidence shows that the tar includes dmesg, `/proc/mtd`, boot logs, or raw NAND. Do not call this endpoint on the assumption that it supplies a recovery backup.

## Remaining useful path

A legitimate system-log export may expose existing boot messages, but its contents must be inspected before claiming a partition map. It stages a sorted system log rather than reading arbitrary paths. Even a log containing `/proc/mtd`-like partition information remains a map, not an actual NAND backup. No candidate in this audit provides the unit-specific factory/bootloader/UBI backup needed to justify flashing.
