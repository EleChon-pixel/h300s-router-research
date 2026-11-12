"""Migrate the H300s using the dedicated Ethernet management link."""
import argparse
import copy
import getpass
import hashlib
import importlib.util
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from configure_access_point import Session,ROOT,read,write

OLD='192.168.2.250'
NEW='192.168.3.1'


def connect(target):
    s=Session();s.target=target;s.network.TARGET=target;s.network.INTERFACE=b'enp44s0\0'
    s.login()
    return s


def backup(s):
    password=getpass.getpass('Existing backup encryption password: ')
    answer=s.request('/data/settings_configuration.json',{
        'ConfigurationSaveType':'computer','ConfigurationSaveDescription':'Before Ethernet WAN routed migration',
        'ConfigurationSavePWD':password})
    if answer.strip().strip(b'"')!=b'1':raise RuntimeError('Backup export request rejected')
    data=s.request('/data/Backup.json')
    spec=importlib.util.spec_from_file_location('decoder',ROOT/'config-analysis/decode_h300s_backup.py')
    decoder=importlib.util.module_from_spec(spec);spec.loader.exec_module(decoder)
    decoder.decode(data,password.encode())
    password=None
    folder=ROOT/'unit-backups'/datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ-pre-routed')
    folder.mkdir(mode=0o700)
    path=folder/'before-routed.config'
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as stream:stream.write(data)
    report={'file':path.name,'sha256':hashlib.sha256(data).hexdigest(),'decryption_verified':True,
        'password_saved':False,'old_LAN':OLD,'intended_LAN':NEW}
    (folder/'metadata.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Encrypted backup saved and validated:',path,flush=True)


def wan_rows(s):
    return [dict(row) for row in s.lan(path='/data/settings_wan2.json') if 'id' in row]


def configure_wan(s):
    original=wan_rows(s)
    assert len({r['id'] for r in original})==len(original)
    target=next(r for r in original if r['id']=='11')
    assert target['access_type']=='ethernet' and target['name']=='EthernetData'
    assert str(target.get('wan_readonly','0'))=='0'
    names='id create_id enable status name access_type used_for nat router firewall dsl_latency vpi vci encapsulation_mode service_category peak_cell_rate sustainable_cell_rate maximum_burst_size ptm_priority vlan_id 802dot1p connection_type wan_ipv6_enable username password service_name authentication_method connection_trigger lcp_echo_request_interval lcp_echo_retry_times ip_addr netmask gateway mtu idle_time obtain_dns_servers_automatically advanced_settings primary_dns_server secondary_dns_server option_12_host_name option_60_vendor_id option_125'.split()
    records=[]
    for row in original:
        record={k:str(row.get(k,'')) for k in names}
        record['create_id']='0'
        record['gateway']=str(row.get('getway',row.get('gateway','')))
        if row['id']=='11':
            record.update({'enable':'1','connection_type':'dhcp','vlan_id':'0','802dot1p':'0',
                'used_for':'DATA,MGNT','nat':'1','router':'1','firewall':'1',
                'wan_ipv6_enable':'0','username':'','password':'','service_name':'',
                'ip_addr':'','netmask':'','gateway':'','mtu':'1500',
                'obtain_dns_servers_automatically':'1','advanced_settings':'0',
                'option_12_host_name':'','option_60_vendor_id':'','option_125':''})
        records.append(record)
    result=s.lan({'wan_data_list':json.dumps(records,separators=(',',':')),
        'del_id_list':'','edit_id_list':'11,'},path='/data/settings_wan2.json')
    print('WAN update response received:',len(result),'bytes',flush=True)
    time.sleep(3)
    after=wan_rows(s)
    row=next(r for r in after if r['name']=='EthernetData' and r['access_type']=='ethernet')
    safe={k:row.get(k) for k in ('id','name','connection_type','vlan_id','nat','firewall','status','ip_addr','getway')}
    print('WAN readback:',json.dumps(safe),flush=True)
    if row['connection_type']!='dhcp' or str(row['vlan_id'])!='0':
        raise RuntimeError('WAN DHCP settings not accepted; stopping before enabling LAN DHCP')


def status(s):
    lan=read(s,'settings_lan')
    print('LAN:',json.dumps({k:lan.get(k) for k in ('LanIP','LanDHCP','LanDHCPStartIP','LanDHCPEndIP')}),flush=True)
    for row in wan_rows(s):
        if row['access_type']=='ethernet':
            print('Ethernet WAN:',json.dumps({k:row.get(k) for k in ('id','name','connection_type','vlan_id','status','ip_addr','getway')}),flush=True)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--target',default=OLD);parser.add_argument('--resume-wan',action='store_true')
    args=parser.parse_args()
    s=connect(args.target)
    if not args.apply:
        status(s);return
    if not args.resume_wan:
        assert read(s,'settings_lan')['LanIP']==OLD
        backup(s)
        try:write(s,'settings_lan',{'LanIP':NEW})
        except (OSError,RuntimeError):print('LAN address request closed the connection; checking new address.',flush=True)
        for attempt in range(30):
            time.sleep(4)
            try:
                s=connect(NEW)
                assert read(s,'settings_lan')['LanIP']==NEW
                print('New H300s LAN address verified:',NEW,flush=True)
                break
            except (OSError,ValueError,RuntimeError):
                if attempt==29:raise
    else:
        assert args.target==NEW and read(s,'settings_lan')['LanIP']==NEW
    configure_wan(s)
    write(s,'settings_lan',{'LanDHCPStartIP':'192.168.3.100','LanDHCPEndIP':'192.168.3.199'})
    pool=read(s,'settings_lan')
    assert pool['LanDHCPStartIP']=='192.168.3.100' and pool['LanDHCPEndIP']=='192.168.3.199'
    write(s,'settings_lan',{'LanDHCP':'1'})
    assert read(s,'settings_lan')['LanDHCP']=='1'
    print('DHCP enabled only on the separate H300s LAN subnet.',flush=True)
    for attempt in range(20):
        rows=wan_rows(s)
        data=next(r for r in rows if r['name']=='EthernetData')
        if data.get('status')=='Connected':break
        time.sleep(3)
    status(s)


if __name__=='__main__':main()
