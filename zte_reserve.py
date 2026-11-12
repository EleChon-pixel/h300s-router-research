"""Add DHCP reservations on the ZTE using a session from zte_login.py. Read-back verified."""
import re
import sys
from xml.etree import ElementTree as ET
from zte_session import SavedZTE

EP = '/?_type=menuData&_tag=dhcp4s_dhcpbinding_m.lua'
WANT = [('H300s-WAN', '02:00:00:00:00:04', '192.168.2.29'), ('laptop', '02:00:00:00:00:01', '192.168.2.6')]


def bindings(z):
    out = []
    for inst in ET.fromstring(z.request(EP)).iter('Instance'):
        n = list(inst); p = {n[i].text: (n[i+1].text or '') for i in range(0, len(n) - 1, 2)}
        out.append(p)
    return out


def has(rows, mac, ip):
    return any(any(v.lower() == mac for k, v in r.items() if k.endswith('MACAddr')) and
               any(v == ip for k, v in r.items() if k.endswith('IPAddr')) for r in rows)


z = SavedZTE()
only = sys.argv[1:] or [w[0] for w in WANT]
for name, mac, ip in WANT:
    if name not in only:
        continue
    z.view('lanMgrIpv4')  # fresh page token
    if has(bindings(z), mac, ip):
        print(name, 'already reserved'); continue
    resp = ET.fromstring(z.request(EP, {'IF_ACTION': 'Apply', 'OBJ_DHCPBIND_ID._OBJ_InstID': '-1',
                                        'OBJ_DHCPBIND_ID.Name': name, 'OBJ_DHCPBIND_ID.MACAddr': mac,
                                        'OBJ_DHCPBIND_ID.IPAddr': ip, '_sessionTOKEN': z.token}))
    print(name, 'apply:', resp.findtext('IF_ERRORSTR'), resp.findtext('IF_ERRORPARAM') or '')
    rows = bindings(z)
    print(name, 'verified:', has(rows, mac, ip))
    if not has(rows, mac, ip):
        print('readback:', rows); sys.exit(1)
print('all bindings:', [{k.split('.')[-1]: v for k, v in r.items()} for r in bindings(z)])
