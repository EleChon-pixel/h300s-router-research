"""Set the HOME-GUEST password (both bands) on the H300s. Password comes from env NEW_GUEST_PSK; never logged.

Preserves all four enable switches (wifi_general writes that omit one disable that network) and verifies by readback
that only the guest passwords changed.
"""
import json
import os
import subprocess
import time
from configure_access_point import ROOT, read, write, decrypt
from migrate_routed import connect

SJCL = ROOT / 'firmware-analysis/current-debug-research/rootfs/usr/www-ap/js/sjcl.js'
SWITCHES = ('wifi_network_onoff', 'wifi_network_onoff_5g', 'wifi_network_onoff_guest', 'wifi_network_onoff_guest_5g')
WATCH = SWITCHES + ('wifi_ssid', 'wifi_ssid_5g', 'wifi_ssid_guest', 'wifi_ssid_guest_5g',
                    'wifi_ap_isolation_guest', 'wifi_ap_isolation_guest_5g', 'wifi_password', 'wifi_password_5g')


def encrypt(session, plain):
    sid = session.cookies['session_id'].value
    js = ("const s=require(process.argv[1]);let b='';process.stdin.on('data',d=>b+=d);"
          "process.stdin.on('end',()=>{const a=JSON.parse(b);process.stdout.write(s.encrypt(a.sid,a.pt));});")
    r = subprocess.run(['node', '-e', js, str(SJCL)], input=json.dumps({'sid': sid, 'pt': plain}),
                       text=True, capture_output=True)
    if r.returncode or not r.stdout.strip().startswith('{'):
        raise RuntimeError('sjcl encrypt failed; nothing written')
    return r.stdout


def main():
    new = os.environ.pop('NEW_GUEST_PSK', '')
    if not 8 <= len(new) <= 63:
        raise SystemExit('NEW_GUEST_PSK must be 8-63 characters')
    s = connect('192.168.3.1')
    before = decrypt(s, read(s, 'wifi_general'))
    fields = {k: str(before[k]) for k in SWITCHES}
    enc = encrypt(s, new)
    fields['wifi_password_guest'] = enc
    fields['wifi_password_guest_5g'] = enc
    write(s, 'wifi_general', fields)
    time.sleep(8)
    s = connect('192.168.3.1')
    after = decrypt(s, read(s, 'wifi_general'))
    ok_guest = after.get('wifi_password_guest') == new and after.get('wifi_password_guest_5g') == new
    unchanged = {k: before.get(k) == after.get(k) for k in WATCH}
    print('guest password set on both bands:', ok_guest)
    print('other settings unchanged:', all(unchanged.values()), {k: v for k, v in unchanged.items() if not v})
    print('state:', {k: after.get(k) for k in WATCH if 'password' not in k})
    if not ok_guest or not all(unchanged.values()):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
