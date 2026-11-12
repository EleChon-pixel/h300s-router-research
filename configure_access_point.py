"""Configure the requested H300s access point without logging Wi-Fi secrets."""
import argparse
import json
import subprocess
import time
from change_lan_ip import Session, ROOT


def read(session, endpoint):
    rows = session.lan(path='/data/'+endpoint+'.json')
    if isinstance(rows,dict):
        return rows
    return {k:v for row in rows for k,v in row.items()}


def decrypt(session, values):
    sid = session.cookies['session_id'].value
    script = "const s=require(process.argv[1]);let b='';process.stdin.on('data',d=>b+=d);process.stdin.on('end',()=>{let a=JSON.parse(b);let o={};for(let [k,v] of Object.entries(a.values)){o[k]=typeof v==='string'&&v.trim().startsWith('{')?s.decrypt(a.sid,v):v;}process.stdout.write(JSON.stringify(o));});"
    result = subprocess.run(['node','-e',script,str(ROOT/'firmware-analysis/current-debug-research/rootfs/usr/www-ap/js/sjcl.js')],
        input=json.dumps({'sid':sid,'values':values}),text=True,capture_output=True)
    if result.returncode:
        raise RuntimeError('Wi-Fi secret decryption failed; no changes applied')
    return json.loads(result.stdout)


def write(session, endpoint, fields):
    if endpoint == 'wifi_general':
        switches = {'wifi_network_onoff','wifi_network_onoff_5g',
                    'wifi_network_onoff_guest','wifi_network_onoff_guest_5g'}
        if not switches.issubset(fields):
            raise ValueError('Wi-Fi updates must include all four enable switches')
    result = session.lan(fields,path='/data/'+endpoint+'.json').strip().strip('"')
    if result != '1':
        raise RuntimeError(endpoint+' rejected update')
    print(endpoint+': update accepted',flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--interface',choices=['enp44s0','wlo1'],default='enp44s0')
    args=parser.parse_args()
    session=Session();session.network.INTERFACE=(args.interface+'\0').encode();session.login()
    current=decrypt(session,read(session,'wifi_general'))
    for suffix in ('','_5g','_guest','_guest_5g'):
        password=current.get('wifi_password'+suffix,'')
        if not isinstance(password,str) or not 8 <= len(password) <= 63:
            raise RuntimeError('Existing Wi-Fi password missing or invalid for '+(suffix or '2.4 GHz'))
    wifi={}
    for suffix in ('','_5g','_guest','_guest_5g'):
        guest='guest' in suffix
        wifi['wifi_ssid'+suffix]='HOME-GUEST' if guest else 'HOME-IOT'
        wifi['wifi_broadcast_ssid'+suffix]='1'
        wifi['wifi_protection'+suffix]='wpa2'
        if guest:
            wifi['wifi_ap_isolation'+suffix]='1'
    wifi['split_ssid_enable']='0'
    for suffix in ('','_5g','_guest','_guest_5g'):
        wifi['wifi_network_onoff'+suffix]='1'
    if args.apply:
        write(session,'wifi_general',wifi)
        write(session,'wifi_settings',{'encrypthion':'aes','encrypthion_5g':'aes'})
        write(session,'wifi_wps',{'wps_24g_onoff':'0','wps_5g_onoff':'0'})
        # Stop both IPv4 and IPv6 address/route announcements on the secondary AP.
        write(session,'settings_lan',{'LanDHCP':'0','ip6_dhcp_server':'0','ip6_router_advertisement':'0'})
        time.sleep(5)
    after=decrypt(session,read(session,'wifi_general'))
    for suffix in ('','_5g','_guest','_guest_5g'):
        if after.get('wifi_password'+suffix) != current.get('wifi_password'+suffix):
            raise RuntimeError('Existing Wi-Fi password changed unexpectedly')
    lan=read(session,'settings_lan');settings=read(session,'wifi_settings');wps=read(session,'wifi_wps')
    report={'wifi':{k:after.get(k) for k in wifi},
        'lan':{k:lan.get(k) for k in ('LanIP','LanDHCP','ip6_dhcp_server','ip6_router_advertisement')},
        'encryption':{k:settings.get(k) for k in ('encrypthion','encrypthion_5g')},
        'wps':{k:wps.get(k) for k in ('wps_24g_onoff','wps_5g_onoff')},'existing_passwords_preserved':True}
    print(json.dumps(report,indent=2),flush=True)
    if args.apply:
        assert all(str(after.get(k))==v for k,v in wifi.items()), 'Wi-Fi readback differs'
        assert str(lan.get('LanDHCP'))=='0', 'DHCP still enabled'
        assert all(str(settings.get(k))=='aes' for k in ('encrypthion','encrypthion_5g'))
        assert all(str(wps.get(k))=='0' for k in ('wps_24g_onoff','wps_5g_onoff'))


if __name__=='__main__':
    main()
