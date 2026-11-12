"""Inspect the main ZTE router using a password supplied interactively."""
import getpass
import base64
import hashlib
import http.client
import json
import re
import socket
from http.cookies import SimpleCookie
from urllib.parse import urlencode
from xml.etree import ElementTree as ET
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.hazmat.primitives.asymmetric.padding import PKCS1v15


class Connection(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket()
        self.sock.settimeout(12)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, b'wlo1\0')
        self.sock.connect(('192.168.2.1', 80))


cookies = SimpleCookie()


def request(path, fields=None):
    conn = Connection('192.168.2.1', timeout=12)
    headers = {'Cookie': '; '.join(k+'='+v.value for k,v in cookies.items()),
               'Referer': 'http://192.168.2.1/', 'X-Requested-With': 'XMLHttpRequest'}
    if fields is not None:
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
        if '_type=menuData' in path:
            digest = hashlib.sha256(urlencode(fields).encode()).hexdigest().encode()
            headers['Check'] = base64.b64encode(management_key.encrypt(digest, PKCS1v15())).decode()
    try:
        conn.request('POST' if fields else 'GET', path,
                     urlencode(fields) if fields else None, headers)
        response = conn.getresponse()
        for k,v in response.getheaders():
            if k.lower() == 'set-cookie':
                cookies.load(v)
        return response.read().decode(errors='replace')
    finally:
        conn.close()


request('/')
info = json.loads(request('/?_type=loginData&_tag=login_entry'))
challenge = ET.fromstring(request('/?_type=loginData&_tag=login_token')).text
password = getpass.getpass('Main router password: ')
result = json.loads(request('/?_type=loginData&_tag=login_entry', {
    'Username': 'admin', 'Password': hashlib.sha256((password+challenge).encode()).hexdigest(),
    '_sessionTOKEN': info['sess_token'], 'action': 'login'}))
password = None
print('Login result:', {k:v for k,v in result.items() if k in
      {'login_need_refresh','loginErrMsg','lockingTime','promptMsg'}}, flush=True)
page = request('/')
key_match = re.search(r'var pubKey = ("[^"\n]+");', page)
management_key = load_pem_public_key(json.loads(key_match.group(1)).encode())
token_match = re.search(r'''_sessionTmpToken\s*=\s*["']([^"']+)["']''', page)
if not token_match:
    token_match = re.search(r'''id=["']_sessionTOKEN["'][^>]*value=["']([^"']+)["']''', page)
session_token = bytes(token_match.group(1), 'utf-8').decode('unicode_escape') if token_match else result.get('sess_token', info['sess_token'])
print('Authenticated page token found:', bool(token_match), flush=True)
for match in re.finditer(r'.{0,180}(?:eth_lanstatus).{0,180}', page):
    print(match.group(0), flush=True)
while True:
    path = input('Read path (blank to exit): ')
    if not path:
        break
    if path == 'rename5g':
        settings_page = request('/?_type=menuView&_tag=wlanBasic')
        match = re.search(r'''_sessionTmpToken\s*=\s*["']([^"']+)["']''', settings_page)
        if not match:
            raise RuntimeError('Missing fresh WLAN token')
        endpoint = '/?_type=menuData&_tag=wlan_sssidconf_lua.lua'
        def aps():
            xml = ET.fromstring(request(endpoint))
            values = {}
            for instance in xml.findall('.//OBJ_WLANAP_ID/Instance'):
                nodes = list(instance)
                params = {nodes[i].text:nodes[i+1].text or '' for i in range(0,len(nodes),2)}
                values[params['_InstID']] = params
            return values
        before = aps()
        fields = dict(before['DEV.WIFI.AP5'])
        assert fields['ESSID'] == 'VODAFONE_H268Q-3514'
        fields['ESSID'] = 'HOME-MAIN'
        fields['IF_ACTION'] = 'Apply'
        fields['_sessionTOKEN'] = bytes(match.group(1),'utf-8').decode('unicode_escape')
        response = ET.fromstring(request(endpoint,fields))
        print('5 GHz rename:',response.findtext('IF_ERRORSTR'),flush=True)
        after = aps()
        assert after['DEV.WIFI.AP5']['ESSID'] == 'HOME-MAIN', 'Rename not confirmed'
        for instance, params in before.items():
            expected = dict(params)
            if instance == 'DEV.WIFI.AP5':
                expected['ESSID'] = 'HOME-MAIN'
            assert after[instance] == expected, 'Other SSID settings changed'
        print('Verified: only AP5 ESSID changed; both main bands are HOME-MAIN',flush=True)
        continue
    if path == 'exclude250':
        settings_page = request('/?_type=menuView&_tag=lanMgrIpv4')
        settings_token = re.search(r'''_sessionTmpToken\s*=\s*["']([^"']+)["']''', settings_page)
        if settings_token:
            session_token = bytes(settings_token.group(1), 'utf-8').decode('unicode_escape')
        print('LAN page token found:', bool(settings_token), flush=True)
        endpoint = '/?_type=menuData&_tag=dhcp4s_dhcpbasiccfg_lua.lua'
        xml = ET.fromstring(request(endpoint))
        instance = xml.find('.//Instance')
        nodes = list(instance)
        fields = {nodes[i].text: nodes[i+1].text or '' for i in range(0, len(nodes), 2)}
        assert fields['IPAddr'] == '192.168.2.1'
        assert fields['MinAddress'] == '192.168.2.2'
        assert fields['MaxAddress'] == '192.168.2.254'
        fields['MaxAddress'] = '192.168.2.249'
        fields['IF_ACTION'] = 'Apply'
        fields['_sessionTOKEN'] = session_token
        response = ET.fromstring(request(endpoint, fields))
        print('DHCP update:', response.findtext('IF_ERRORSTR'), flush=True)
        print('Update response structure:', [(n.tag, (n.text or '')[:100]) for n in response if 'token' not in n.tag.lower()], flush=True)
        check = ET.fromstring(request(endpoint))
        nodes = list(check.find('.//Instance'))
        values = {nodes[i].text: nodes[i+1].text for i in range(0, len(nodes), 2)}
        print('Verified main DHCP pool:', values.get('MinAddress'), values.get('MaxAddress'), flush=True)
        continue
    if not path.startswith('/?_type='):
        print('Only management read URLs accepted', flush=True)
        continue
    data = request(path)
    print('Bytes:', len(data), flush=True)
    if data.lstrip().startswith('<'):
        try:
            xml = ET.fromstring(data)
            for instance in xml.iter('Instance'):
                pairs = list(instance)
                for i, node in enumerate(pairs[:-1]):
                    if node.tag == 'ParaName' and re.search(r'pool|start|end|mask|ipaddr|dhcp|enable|aliasname|link|status|bytessent|bytesreceived|ssid|radio|band', node.text or '', re.I) and not re.search(r'password|passphrase|key|secret',node.text or '',re.I):
                        print(node.text, pairs[i+1].text, flush=True)
        except ET.ParseError:
            pass
    if '_tag=dhcp4s_dhcpbasiccfg_lua.lua' in path:
        print(data, flush=True)
    for match in re.finditer(r'.{0,130}(?:IF_ACTION|_InstID|_sessionTOKEN|form-action|PostData|postData|postval).{0,200}', data):
        print(match.group(0), flush=True)
