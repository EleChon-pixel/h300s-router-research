# H300s 1.2.02.08 generic API and SSH handler audit

Offline inspection only. No router requests, credential attempts, configuration writes, restores, or uploads were performed by this agent.

## Generic API lead: not supported by the observed dispatch implementation

The strings `/data/api_get_cmd.json` and `/data/api_set_cmd.json` occur in `setup.cgi`, but their only code references are in the session/authentication exception function at `0x413484`, specifically URI substring comparisons at `0x41377c` and `0x413794`. They are not evidence of implemented CML endpoints.

A complete reconstruction of the JSON dispatch table at VA `0x46f02c` (36-byte records) contains **1689 records and 143 page groups**, ending at the null-name sentinel. Neither `api_get_cmd` nor `api_set_cmd` occurs among group or parameter names. No corresponding files exist in the extracted rootfs's `data/` or `json_vars/` directories. `setup.cgi` imports `cm_value_get` but not `cm_value_set`; no arbitrary CML setter is established.

The actual POST JSON dispatcher at `0x44e040` parses a page name, calls the group lookup at `0x44d8fc`, and invokes only a table-registered group callback (record offset 20) if found. Group lookup scans records with type byte 1, compares exact names, and returns -1 at the sentinel (`0x44d8fc–0x44d980`). If no group matches, it falls back to the JSON-template renderer, not an arbitrary CML interface.

The renderer at `0x414548` first reads an existing JSON file with `json_object_from_file` (`0x4145b8`), then looks up a known group. Missing files return null. An unknown group in an existing file simply returns the parsed template (`0x4146dc`). There is no discovered request schema for reading or setting arbitrary datamodel keys.

**Conclusion:** Do not send speculative `api_set_cmd` writes. Those names appear to be stale/common-code authentication whitelist entries in this firmware, not a working engineer interface. This is a static conclusion within the extracted binary's dispatch model, not a live reachability measurement.

## Normal SSH controls: exact backend gate confirmed

`settings_access_control` is table record 477, handler `0x429360`. Its parameters are predefined: ICMP mode/trust fields, `ssh_wan`, `ssh_lan`, read-only `ssh_status`, HTTP mode/trust fields, and TR-069 mode/trust fields.

- `ssh_wan` getter `0x428b64`, field setter `0x428bf4`.
- `ssh_lan` getter `0x428c7c`, field setter `0x428d0c`.
- `ssh_status` getter `0x428d94`, **no setter**.

The individual field setters only update temporary bitmasks (`0x4b68f4` mode, `0x4b68f0` trust). They do not write CML or start a daemon. LAN is bit 1; WAN is bit 2. Strings are `deny`, `trusted`, `allow`; output conversion uses `lan`, `wan`.

After parameter parsing, the group handler calls `getFwVersion` (`0x4293fc`) and searches its result for `_debug` (`0x42940c`). Both the internal privileged-mode flag at `0x47e2c0` and a non-null `_debug` match are required to reach `cfg_firewall_AccessControl_SSHMode_set` (`0x429438`) and the SSH-trust setter (`0x42944c`). A normal release skips these writes. Other access-control writes still proceed, `CM_Commit` runs (`0x4294a4`), services are applied, and success is returned.

**Practical implication:** A POST requesting `ssh_lan=allow` on stock release may report success while leaving SSH unchanged. This is a backend gate, not merely hidden HTML. Do not repeat the whole access-control POST because it can change unrelated ICMP/HTTP/TR-069 settings while SSH remains gated.

`ssh_status` is the result of `process_running("sshd")` (`0x428da8`); it reports process state rather than a writable enable parameter.

## Reproduction and artifacts

- `extract_dispatch.py`: fixed-layout table extractor for this exact ELF32 big-endian artifact.
- `dispatch-evidence.json`: includes binary SHA256, all records, callback addresses.
- `dispatch-table.json`: initial flat table reconstruction.
- `setup.disasm`: complete MIPS disassembly from `mips-linux-gnu-objdump -d`.

The extractor uses this artifact's section mapping; do not apply its addresses blindly to other releases. All conclusions are static and do not establish runtime modifications or exploitable bypasses.
