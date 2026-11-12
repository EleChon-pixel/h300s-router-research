"""Pin compatible H300s channels while preserving SSIDs, passwords and isolation."""
import json
import time
from configure_access_point import Session,read,write,decrypt

s=Session();s.network.INTERFACE=b'wlo1\0';s.login()
before=decrypt(s,read(s,'wifi_general'))
switches=('wifi_network_onoff','wifi_network_onoff_5g','wifi_network_onoff_guest','wifi_network_onoff_guest_5g')
fields={k:before[k] for k in switches}
fields.update({'wifi_channel':'6','wifi_channel_5g':'36',
    'wifi_ap_isolation_guest':before['wifi_ap_isolation_guest'],
    'wifi_ap_isolation_guest_5g':before['wifi_ap_isolation_guest_5g']})
write(s,'wifi_settings',{'bandwidth':'20MHz','auto_channel_reselection':'0','auto_channel_reselection_5g':'0'})
write(s,'wifi_general',fields)
for attempt in range(12):
    time.sleep(4)
    try:
        s=Session();s.network.INTERFACE=b'wlo1\0';s.login()
        after=decrypt(s,read(s,'wifi_general'));settings=read(s,'wifi_settings')
        break
    except (OSError,ValueError,RuntimeError):
        if attempt==11:raise
for suffix in ('','_5g','_guest','_guest_5g'):
    for field in ('wifi_password','wifi_ssid','wifi_network_onoff','wifi_protection'):
        assert after[field+suffix]==before[field+suffix], 'An unrelated Wi-Fi setting changed'
assert after['wifi_channel']=='6'
assert 'id:36|value:36|select:1' in after['wifi_channel_5g'] or after['wifi_channel_5g']=='36'
assert settings['bandwidth']=='20MHz'
print(json.dumps({'2.4_GHz_channel':after['wifi_channel'],
    '5_GHz_channel':'36','2.4_GHz_width':settings['bandwidth'],
    'SSIDs_and_passwords_preserved':True,'network_enable_states_preserved':True,
    'guest_isolation_preserved':all(after[k]==before[k] for k in
        ('wifi_ap_isolation_guest','wifi_ap_isolation_guest_5g'))},indent=2),flush=True)
