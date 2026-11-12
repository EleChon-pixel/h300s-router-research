"""Recover ZTE Wi-Fi using the existing local connection secret, without logging it."""
import base64
import argparse
import getpass
import hashlib
import http.client
import json
import re
import socket
import secrets
import subprocess
from http.cookies import SimpleCookie
from urllib.parse import urlencode
from xml.etree import ElementTree as ET
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.hazmat.primitives.asymmetric.padding import PKCS1v15
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


class Connection(http.client.HTTPConnection):
    def connect(self):
        self.sock=socket.socket();self.sock.settimeout(15)
        self.sock.setsockopt(socket.SOL_SOCKET,socket.SO_BINDTODEVICE,b'wlo1\0')
        self.sock.connect(('192.168.2.1',80))


class ZTE:
    def __init__(self):
        self.cookies=SimpleCookie()
        self.request('/')
        info=json.loads(self.request('/?_type=loginData&_tag=login_entry'))
        challenge=''.join(ET.fromstring(self.request('/?_type=loginData&_tag=login_token')).itertext())
        password=getpass.getpass('Main router admin password: ')
        result=json.loads(self.request('/?_type=loginData&_tag=login_entry',{
            'Username':'admin','Password':hashlib.sha256((password+challenge).encode()).hexdigest(),
            '_sessionTOKEN':info['sess_token'],'action':'login'}))
        password=None
        if not result.get('login_need_refresh'):
            raise RuntimeError('Admin login failed: '+json.dumps({k:v for k,v in result.items()
                if k in ('loginErrMsg','lockingTime','promptMsg','login_need_refresh')}))
        self.page=self.request('/')
        key=re.search(r'var pubKey = ("[^"\n]+");',self.page)
        self.key=load_pem_public_key(json.loads(key.group(1)).encode())

    def request(self,path,fields=None):
        body=urlencode(fields) if fields is not None else None
        headers={'Cookie':'; '.join(k+'='+v.value for k,v in self.cookies.items()),
            'Referer':'http://192.168.2.1/','X-Requested-With':'XMLHttpRequest'}
        if body is not None:
            headers['Content-Type']='application/x-www-form-urlencoded'
            if '_type=menuData' in path:
                digest=hashlib.sha256(body.encode()).hexdigest().encode()
                headers['Check']=base64.b64encode(self.key.encrypt(digest,PKCS1v15())).decode()
        c=Connection('192.168.2.1',timeout=15)
        try:
            c.request('POST' if fields is not None else 'GET',path,body,headers)
            r=c.getresponse();data=r.read().decode(errors='replace')
            for k,v in r.getheaders():
                if k.lower()=='set-cookie':self.cookies.load(v)
            return data
        finally:c.close()

    def wlan(self):
        page=self.request('/?_type=menuView&_tag=wlanBasic')
        token=re.search(r'''_sessionTmpToken\s*=\s*["']([^"']+)["']''',page)
        self.token=bytes(token.group(1),'utf-8').decode('unicode_escape')
        return page


def instances(xml,tag):
    result={}
    for instance in xml.findall('.//'+tag+'/Instance'):
        nodes=list(instance)
        p={nodes[i].text:nodes[i+1].text or '' for i in range(0,len(nodes),2)}
        result[p['_InstID']]=p
    return result


def read_password(z,instance):
    endpoint='/?_type=menuData&_tag=wlan_sssidconf_lua.lua'
    response=ET.fromstring(z.request(endpoint,{'IF_ACTION':'GetPassword',
        '_InstID_PASS':instance+'.PSK1','PASSTYPE':'PSK','_sessionTOKEN':z.token}))
    ciphertext=instances(response,'OBJ_WLANPSK_ID')[instance+'.PSK1']['KeyPassphrase']
    decryptor=Cipher(algorithms.AES(hashlib.sha256(z.token.encode()).digest()),
        modes.CBC(hashlib.sha256(z.token[::-1].encode()).digest()[:16])).decryptor()
    return (decryptor.update(base64.b64decode(ciphertext))+decryptor.finalize()).rstrip(b'\0').decode()


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--rollback5g',action='store_true');parser.add_argument('--inspect-form',action='store_true');parser.add_argument('--unify-working-key',action='store_true');parser.add_argument('--set-password',action='store_true');args=parser.parse_args()
    z=ZTE();page=z.wlan()
    if args.inspect_form:
        for pattern in ('_PSKCONIG',):
            for match in re.finditer(re.escape(pattern),page):
                print(page[max(0,match.start()-400):match.start()+650],flush=True)
        start=page.find('id="template_WLANSSIDConf"')
        section=page[start:]
        print('SSID form inputs:',re.findall(r'<(?:input|select)\b[^>]*\bid="([^"]+)"',section)[:50],flush=True)
        return
    secret=subprocess.run(['nmcli','--show-secrets','-g','802-11-wireless-security.psk',
        'connection','show','VODAFONE_H268Q-3514'],capture_output=True,text=True,check=True).stdout.strip()
    if not 8<=len(secret)<=63:raise RuntimeError('Existing HOME-MAIN secret unavailable')
    print('Previously saved Vodafone profile password available.',flush=True)
    xml=ET.fromstring(z.request('/?_type=menuData&_tag=wlan_sssidconf_lua.lua'))
    ap=instances(xml,'OBJ_WLANAP_ID')
    print('Primary security:',{i:{k:v for k,v in ap[i].items() if k in
        ('Enable','ESSID','BeaconType','WPAAuthMode','11iAuthMode','WPAEncryptionModes','11iEncryptionModes')}
        for i in ('DEV.WIFI.AP1','DEV.WIFI.AP5')},flush=True)
    passwords={}
    endpoint='/?_type=menuData&_tag=wlan_sssidconf_lua.lua'
    for i in ('DEV.WIFI.AP1','DEV.WIFI.AP5'):
        response=ET.fromstring(z.request(endpoint,{'IF_ACTION':'GetPassword',
            '_InstID_PASS':i+'.PSK1','PASSTYPE':'PSK','_sessionTOKEN':z.token}))
        params=instances(response,'OBJ_WLANPSK_ID')
        print(i,'readback status',response.findtext('IF_ERRORSTR'),'instances',list(params),flush=True)
        ciphertext=params.get(i+'.PSK1',{}).get('KeyPassphrase')
        if not ciphertext:
            print('Response parameter names:',[n.text for n in response.iter('ParaName')],flush=True)
            continue
        key=hashlib.sha256(z.token.encode()).digest()
        iv=hashlib.sha256(z.token[::-1].encode()).digest()[:16]
        decryptor=Cipher(algorithms.AES(key),modes.CBC(iv)).decryptor()
        plain=(decryptor.update(base64.b64decode(ciphertext))+decryptor.finalize()).rstrip(b'\0').decode()
        passwords[i]=plain
        print(i,'matches saved original profile:',plain==secret,'length:',len(plain),flush=True)
    if len(passwords)==2:
        print('Both main bands have identical passwords:',len(set(passwords.values()))==1,flush=True)
        print('Primary password whitespace-only:',passwords['DEV.WIFI.AP1'].isspace(),flush=True)
    if args.unify_working_key or args.set_password:
        if args.set_password:
            secret=getpass.getpass('Requested HOME-MAIN password: ')
            if not 8<=len(secret)<=63 or not secret.isascii():raise RuntimeError('Invalid requested password')
        else:
            assert passwords['DEV.WIFI.AP5']==secret, 'Saved working password differs from live Vodafone band'
        for instance in ('DEV.WIFI.AP1','DEV.WIFI.AP5'):
            z.wlan()
            crypto_key=''.join(str(secrets.randbelow(10)) for _ in range(16))
            crypto_iv=''.join(str(secrets.randbelow(10)) for _ in range(16))
            plain=secret.encode();plain+=b'\0'*((-len(plain))%16)
            encryptor=Cipher(algorithms.AES(hashlib.sha256(crypto_key.encode()).digest()),
                modes.CBC(hashlib.sha256(crypto_iv.encode()).digest()[:16])).encryptor()
            fields=dict(ap[instance])
            fields.update({'IF_ACTION':'Apply','_InstID_PSK':instance+'.PSK1',
                '_PSKCONIG':'Y','EncryptionType':'WPA/WPA2-PSK-TKIP/AES',
                'ESSID':'HOME-MAIN','Switch_KeyPassType':'1',
                'KeyPassphrase':base64.b64encode(encryptor.update(plain)+encryptor.finalize()).decode(),
                'encode':base64.b64encode(z.key.encrypt((crypto_key+'+'+crypto_iv).encode(),PKCS1v15())).decode(),
                '_sessionTOKEN':z.token})
            response=ET.fromstring(z.request(endpoint,fields))
            if response.findtext('IF_ERRORSTR')!='SUCC':raise RuntimeError('Wi-Fi update rejected')
            actual=read_password(z,instance)
            print(instance,'working password verified:',actual==secret,flush=True)
            if actual!=secret:raise RuntimeError('Password update not effective; next band not changed')
        after=instances(ET.fromstring(z.request(endpoint)),'OBJ_WLANAP_ID')
        assert all(after[i]['ESSID']=='HOME-MAIN' and after[i]['Enable']=='1' for i in ('DEV.WIFI.AP1','DEV.WIFI.AP5'))
        print('Both HOME-MAIN bands verified with the requested matching password.',flush=True)
    if args.rollback5g:
        assert len(passwords)==2
        z.wlan()
        fields=dict(ap['DEV.WIFI.AP5'])
        fields.update({'ESSID':'VODAFONE_H268Q-3514','IF_ACTION':'Apply','_sessionTOKEN':z.token})
        response=ET.fromstring(z.request(endpoint,fields))
        if response.findtext('IF_ERRORSTR')!='SUCC':raise RuntimeError('SSID rollback rejected')
        after=instances(ET.fromstring(z.request(endpoint)),'OBJ_WLANAP_ID')
        assert after['DEV.WIFI.AP1']==ap['DEV.WIFI.AP1'],'Primary 2.4 GHz changed'
        assert after['DEV.WIFI.AP5']['ESSID']=='VODAFONE_H268Q-3514'
        assert read_password(z,'DEV.WIFI.AP1')==passwords['DEV.WIFI.AP1']
        assert read_password(z,'DEV.WIFI.AP5')==passwords['DEV.WIFI.AP5']
        print('Verified rollback: HOME-MAIN on 2.4 GHz, original Vodafone name on 5 GHz; both passwords preserved.',flush=True)
    if args.apply:
        assert len(passwords)==2 and 8<=len(passwords['DEV.WIFI.AP1'])<=63
        z.wlan()
        crypto_key=''.join(str(secrets.randbelow(10)) for _ in range(16))
        crypto_iv=''.join(str(secrets.randbelow(10)) for _ in range(16))
        plain=passwords['DEV.WIFI.AP1'].encode()
        plain+=b'\0'*((-len(plain))%16)
        encryptor=Cipher(algorithms.AES(hashlib.sha256(crypto_key.encode()).digest()),
            modes.CBC(hashlib.sha256(crypto_iv.encode()).digest()[:16])).encryptor()
        fields=dict(ap['DEV.WIFI.AP5'])
        fields.update({'IF_ACTION':'Apply','_InstID_PSK':'DEV.WIFI.AP5.PSK1',
            'KeyPassphrase':base64.b64encode(encryptor.update(plain)+encryptor.finalize()).decode(),
            'encode':base64.b64encode(z.key.encrypt((crypto_key+'+'+crypto_iv).encode(),PKCS1v15())).decode(),
            '_sessionTOKEN':z.token})
        response=ET.fromstring(z.request(endpoint,fields))
        if response.findtext('IF_ERRORSTR')!='SUCC':
            raise RuntimeError('5 GHz password update rejected: '+str(response.findtext('IF_ERRORSTR')))
        assert read_password(z,'DEV.WIFI.AP1')==passwords['DEV.WIFI.AP1'], '2.4 GHz password changed'
        assert read_password(z,'DEV.WIFI.AP5')==passwords['DEV.WIFI.AP1'], '5 GHz password synchronization failed'
        after=instances(ET.fromstring(z.request(endpoint)),'OBJ_WLANAP_ID')
        assert after==ap,'Other Wi-Fi settings changed'
        print('Verified: both HOME-MAIN bands now use the original 2.4 GHz password; other settings unchanged.',flush=True)


if __name__=='__main__':main()
