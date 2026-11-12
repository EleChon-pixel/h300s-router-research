"""Export an encrypted H300s config backup, verify it decrypts, save it under unit-backups/. Password never stored.

Usage: python3 backup_h300s.py [label]   (password via terminal, or a zenity dialog when there is no terminal)
"""
import getpass
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from configure_access_point import ROOT
from migrate_routed import connect


def ask(prompt):
    if sys.stdin.isatty():
        return getpass.getpass(prompt)
    r = subprocess.run(['zenity', '--password', '--title', 'H300s backup encryption password'],
                       capture_output=True, text=True, timeout=300)
    if r.returncode:
        raise SystemExit('Password dialog cancelled')
    return r.stdout.rstrip('\n')


def main():
    label = (sys.argv[1] if len(sys.argv) > 1 else 'routed-final').replace('/', '-')
    password = ask('Backup encryption password: ')
    if len(password) < 4:
        raise SystemExit('Password too short')
    s = connect('192.168.3.1')
    answer = s.request('/data/settings_configuration.json', {
        'ConfigurationSaveType': 'computer', 'ConfigurationSaveDescription': label,
        'ConfigurationSavePWD': password})
    if answer.strip().strip(b'"') != b'1':
        raise RuntimeError('Backup export request rejected')
    data = s.request('/data/Backup.json')
    spec = importlib.util.spec_from_file_location('decoder', ROOT / 'config-analysis/decode_h300s_backup.py')
    decoder = importlib.util.module_from_spec(spec); spec.loader.exec_module(decoder)
    decoder.decode(data, password.encode())  # raises if it does not decrypt
    password = None
    folder = ROOT / 'unit-backups' / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + label)
    folder.mkdir(mode=0o700)
    path = folder / (label + '.config')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data)
    (folder / 'metadata.json').write_text(json.dumps({
        'file': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
        'decryption_verified': True, 'password_saved': False, 'lan': '192.168.3.1',
        'note': 'Routed mode, TV lease, IP filter (TV->laptop accept, 3.x->2.x reject), guest PSK updated'}, indent=2) + '\n')
    print('Encrypted backup saved and verified:', path, len(data), 'bytes')


if __name__ == '__main__':
    main()
