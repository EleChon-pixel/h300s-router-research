"""TV static lease + block H300s LAN/guest -> main LAN, except TV -> laptop Jellyfin tunnel.

Usage: python3 tv_isolation.py [--lease] [--filter] [--probe-accept] [--rollback-filter]
Without flags it only prints current state. Management goes over enp44s0 to 192.168.3.1.
"""
import argparse
import json
import time
from migrate_routed import connect
from configure_access_point import read, write

TV = {'staticdhcp_name': 'LGwebOSTV', 'staticdhcp_mac': '02:00:00:00:00:02', 'staticdhcp_ip': '192.168.3.102'}
LAPTOP_MAIN = '192.168.2.6'
LAPTOP_H300S = '192.168.3.100'


def rule(name, proto, src, dst, status):
    return {'id': '0', 'type': 'ip_filter', 'name': name, 'protocol': proto,
            'source_start_address': src[0], 'source_end_address': src[1],
            'destination_start_address': dst[0], 'destination_end_address': dst[1],
            'outgoing_interface': 'all', 'status': status}


TV_ACCEPT = rule('TV-Jellyfin', 'tcp', (TV['staticdhcp_ip'], TV['staticdhcp_ip']), (LAPTOP_MAIN, LAPTOP_MAIN), 'accept')
BLOCK_MAIN = rule('Block-main-LAN', 'tcp_udp', ('192.168.3.2', '192.168.3.254'), ('192.168.2.1', '192.168.2.254'), 'reject')
# Temporary: proves accept-before-reject ordering using the laptop's wired H300s address.
PROBE = rule('Probe-accept', 'tcp', (LAPTOP_H300S, LAPTOP_H300S), ('192.168.2.1', '192.168.2.1'), 'accept')


def filters(s):
    return s.lan(path='/data/internet_ip_filter.json')


def set_filters(s, rules):
    answer = s.lan({'internet_ip_filter': json.dumps(rules, separators=(',', ':'))},
                   path='/data/internet_ip_filter.json').strip().strip('"')
    if not answer:  # page replies '[ ]' on success (its UI only checks non-empty); readback is authoritative
        raise RuntimeError('internet_ip_filter returned empty response')
    time.sleep(3)
    after = filters(s)
    got = [(r.get('name'), r.get('status'), r.get('source_start_address'), r.get('destination_start_address')) for r in after]
    want = [(r['name'], r['status'], r['source_start_address'], r['destination_start_address']) for r in rules]
    print('filter readback:', json.dumps(after), flush=True)
    if got != want:
        raise RuntimeError('filter readback differs from request')


def show(s):
    print('static leases:', json.dumps(s.lan(path='/data/settings_lan_staticdhcp.json')))
    print('filters:', json.dumps(filters(s)))
    lan = read(s, 'settings_lan')
    print('lan:', json.dumps({k: lan.get(k) for k in ('LanIP', 'LanDHCP', 'LanDHCPStartIP', 'LanDHCPEndIP')}))


def main():
    p = argparse.ArgumentParser()
    for f in ('--lease', '--filter', '--probe-accept', '--rollback-filter'):
        p.add_argument(f, action='store_true')
    a = p.parse_args()
    s = connect('192.168.3.1')
    if a.lease:
        before = s.lan(path='/data/settings_lan_staticdhcp.json')
        if before:
            raise RuntimeError('static lease list not empty; refusing to overwrite: %s' % json.dumps(before))
        write(s, 'settings_lan', {'LanStaticDHCPList': json.dumps([TV], separators=(',', ':'))})
        time.sleep(3)
        s = connect('192.168.3.1')
        after = s.lan(path='/data/settings_lan_staticdhcp.json')
        if not any(r.get('staticdhcp_mac', '').upper() == TV['staticdhcp_mac'] and r.get('staticdhcp_ip') == TV['staticdhcp_ip'] for r in after):
            raise RuntimeError('static lease readback missing: %s' % json.dumps(after))
        print('TV static lease verified', flush=True)
    if a.rollback_filter:
        set_filters(s, [])
    elif a.probe_accept:
        set_filters(s, [TV_ACCEPT, PROBE, BLOCK_MAIN])
    elif a.filter:
        if filters(s) not in ([], [TV_ACCEPT, BLOCK_MAIN]) and not all(r.get('name') in ('TV-Jellyfin', 'Block-main-LAN', 'Probe-accept') for r in filters(s)):
            raise RuntimeError('unexpected existing filters; refusing to overwrite')
        set_filters(s, [TV_ACCEPT, BLOCK_MAIN])
    show(s)


if __name__ == '__main__':
    main()
