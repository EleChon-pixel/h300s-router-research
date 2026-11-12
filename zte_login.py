"""Log in to the ZTE once (password prompt) and save only the session cookie for follow-up scripts.

The password is never stored. The cookie file is 0600 and should be deleted when done (zte_session.py --logout).
"""
import getpass
import json
import os
import subprocess
import sys
from pathlib import Path
import recover_main_wifi
from recover_main_wifi import ZTE

if not sys.stdin.isatty():  # no terminal (e.g. agent shell): ask via a desktop dialog instead
    def _gui_pass(prompt='Password: '):
        r = subprocess.run(['zenity', '--password', '--title', 'ZTE main router (192.168.2.1) admin password'],
                           capture_output=True, text=True, timeout=300)
        if r.returncode:
            raise SystemExit('Password dialog cancelled')
        return r.stdout.rstrip('\n')
    recover_main_wifi.getpass.getpass = _gui_pass
    getpass.getpass = _gui_pass

SESSION = Path(__file__).with_name('.zte_session.json')

z = ZTE()
fd = os.open(SESSION, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as f:
    json.dump({k: v.value for k, v in z.cookies.items()}, f)
print('ZTE login OK; session saved to', SESSION, '(no password stored)')
