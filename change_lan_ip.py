"""Change this H300s LAN address through its stock management API."""
import argparse
import hashlib
import importlib.util
import json
import re
import time
from pathlib import Path
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('snapshot', ROOT / 'session-snapshot.py')
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)


class Session(snapshot.Session):
    target = '192.168.2.250'

    def login(self):
        self.request('/login.html')
        info = self.read('/data/login.json')
        if str(info.get('delay_time', '0')) not in {'0', ''}:
            raise RuntimeError('Login delay active')
        backup = ROOT / 'unit-backups/20261112T023307Z/superuser.xml'
        root = ET.fromstring(backup.read_bytes().rstrip(b'\x00\xff\n\r '))
        passwords = [c.attrib.get('value') or c.text for n in root.iter()
                     if n.attrib.get('name') == '1.' for c in n
                     if c.attrib.get('name') == 'Password']
        passwords = [p for p in passwords if p]
        if len(passwords) != 1:
            raise RuntimeError('No unique saved account password')
        challenge = info['challenge']
        digest = hashlib.sha256((passwords[0]+challenge).encode()).hexdigest()
        if self.request('/data/reset.json', {'chk_sys_busy': ''}).strip() == b'1':
            raise RuntimeError('Router busy')
        response = self.request('/data/login.json', {'LoginName': 'superuser',
            'LoginPWD': digest, 'challenge': challenge})
        if response.strip().strip(b'"') != b'1':
            raise RuntimeError('Saved unit credential rejected; stopping')
        self.request('/overview.html')
        role = self.read('/data/user_data.json')
        if role.get('usermode') != 'admin':
            raise RuntimeError('Expected admin permissions')

    def lan(self, fields=None, path='/data/settings_lan.json'):
        self.network.TARGET = self.target
        query = urlencode({'_': int(time.time() * 1000), 'csrf_token': self.token})
        headers = {'Host': self.target, 'Cookie': '; '.join(k+'='+v.value for k,v in self.cookies.items()),
                   'Referer': 'http://'+self.target+'/overview.html',
                   'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
                   'X-Requested-With': 'XMLHttpRequest', 'Connection': 'close'}
        body = None
        if fields is not None:
            if 'LanIP' in fields:
                assert fields['LanIP'] in {'192.168.2.250','192.168.3.1'}
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            body = urlencode(fields)
        conn = self.network.EthernetConnection(self.target, timeout=20)
        try:
            conn.request('POST' if fields else 'GET', path+'?'+query, body, headers)
            response = conn.getresponse()
            data = response.read()
            if response.status != 200:
                raise RuntimeError('LAN API HTTP '+str(response.status))
            if fields is not None:
                return data.decode()
            if path != '/data/settings_lan.json':
                return json.loads(data)
            return {k:v for row in json.loads(data) for k,v in row.items()}
        finally:
            conn.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    session = Session()
    session.login()
    current = session.lan()
    print(json.dumps({k:v for k,v in current.items() if k in
        {'LanIP', 'LanSubnetMask', 'LanDHCP', 'LanDHCPStartIP', 'LanDHCPEndIP'}}, indent=2), flush=True)
    if not args.apply:
        return
    assert current['LanIP'] == '192.168.2.1'
    keys = ['LanIP', 'LanSubnetMask', 'LanHostName', 'LanDHCP']
    if str(current['LanDHCP']) == '1':
        keys.extend(['LanDHCPStartIP', 'LanDHCPEndIP', 'LanDHCPDomainName', 'LanStaticDHCPList'])
        reservations = session.lan(path='/data/settings_lan_staticdhcp.json')
        if reservations:
            raise RuntimeError('Existing reservations require explicit preservation')
        current['LanStaticDHCPList'] = '[]'
    keys.extend(['ip6_dhcp_server', 'ip6_router_advertisement', 'LanDNSServer', 'LanDNSProxy', 'LanDHCPLeaseTime'])
    fields = {k: current[k] for k in keys if k in current}
    fields['LanIP'] = '192.168.2.250'
    if str(current['LanDHCP']) == '1' and current.get('LanDHCPEndIP') == '192.168.2.254':
        fields['LanDHCPEndIP'] = '192.168.2.249'
    print('Apply:', session.lan(fields), flush=True)
    session.target = '192.168.2.250'
    for attempt in range(12):
        try:
            result = session.lan()
            if result.get('LanIP') == session.target:
                print('Verified LAN IP:', result['LanIP'], flush=True)
                return
        except (OSError, ValueError, RuntimeError):
            pass
        time.sleep(3)
    raise RuntimeError('Change submitted; new address not yet verified')


if __name__ == '__main__':
    main()
