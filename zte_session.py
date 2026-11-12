"""Reuse a ZTE session saved by zte_login.py (no password prompt)."""
import json
import re
import sys
from http.cookies import SimpleCookie
from pathlib import Path
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from recover_main_wifi import ZTE, instances  # noqa: F401  (instances re-exported for callers)

SESSION = Path(__file__).with_name('.zte_session.json')


class SavedZTE(ZTE):
    def __init__(self):  # skip interactive login
        self.cookies = SimpleCookie()
        for k, v in json.loads(SESSION.read_text()).items():
            self.cookies[k] = v
        self.page = self.request('/')
        key = re.search(r'var pubKey = ("[^"\n]+");', self.page)
        if not key:
            raise RuntimeError('Saved ZTE session expired; rerun zte_login.py')
        self.key = load_pem_public_key(json.loads(key.group(1)).encode())

    def view(self, tag):
        page = self.request('/?_type=menuView&_tag=' + tag)
        m = re.search(r'''_sessionTmpToken\s*=\s*["']([^"']+)["']''', page)
        if m:
            self.token = bytes(m.group(1), 'utf-8').decode('unicode_escape')
        return page


if __name__ == '__main__' and '--logout' in sys.argv:
    try:
        SavedZTE().request('/?_type=loginData&_tag=logout_entry', {'IF_LogOff': '1'})
    except Exception:
        pass
    SESSION.unlink(missing_ok=True)
    print('ZTE session file removed')
