"""Inspect a fresh configuration export in memory; do not save its secrets."""
import importlib.util
import json
import secrets
import time
from urllib.parse import urlencode, urlsplit
from configure_access_point import Session, ROOT


s=Session();s.network.INTERFACE=b'wlo1\0';s.login()
password=secrets.token_urlsafe(24)
answer=s.request('/data/settings_configuration.json',{
    'ConfigurationSaveType':'computer', 'ConfigurationSaveDescription':'Guest network diagnostics',
    'ConfigurationSavePWD':password})
if answer.strip().strip(b'"')!=b'1':
    raise RuntimeError('Export request failed')


def fetch(path):
    headers={'Host':s.target,'Cookie':'; '.join(k+'='+v.value for k,v in s.cookies.items()),
        'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
        'Referer':'http://'+s.target+'/overview.html','X-Requested-With':'XMLHttpRequest'}
    c=s.network.EthernetConnection(s.target,timeout=20)
    try:
        c.request('GET',path,headers=headers);r=c.getresponse();data=r.read()
        return r.status,r.getheader('Location'),data
    finally:
        c.close()


status,location,data=fetch('/data/Backup.json?'+urlencode({'_':int(time.time()*1000),'csrf_token':s.token}))
if status in (301,302,303,307,308):
    u=urlsplit(location)
    assert u.netloc in ('',s.target) and u.path.startswith('/download/')
    status,_,data=fetch(u.path+('?' + u.query if u.query else ''))
assert status==200
spec=importlib.util.spec_from_file_location('decoder',ROOT/'config-analysis/decode_h300s_backup.py')
decoder=importlib.util.module_from_spec(spec);spec.loader.exec_module(decoder)
_,root,_,_=decoder.decode(data,password.encode())
password=None
allowed={'Enable','Interface','MinAddress','MaxAddress','IPRouters','IPAddress','SubnetMask',
         'LowerLayers','Name','SSIDReference','X_SC_APIsolate','X_SC_CipherConfigMethods','ModeEnabled'}


def walk(n,path=''):
    name=n.attrib.get('name',n.tag);p=path+'/'+name
    relevant=('/DHCPv4./Server./' in p or '/Bridging./Bridge./' in p or
              any('/IP./Interface./'+str(i)+'./' in p for i in (16,17)) or
              any('/WiFi./AccessPoint./'+str(i)+'./' in p for i in (2,6)))
    excluded=any(x in p for x in ('/Stats./','/StaticAddress./','/Client./','/Option./','/WPS./','/AssociatedDevice./'))
    if relevant and not excluded and name in allowed and not list(n):
        print(p,n.attrib.get('value',n.text))
    for c in n:
        walk(c,p)


walk(root)
