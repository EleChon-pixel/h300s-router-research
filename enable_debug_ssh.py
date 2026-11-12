"""Enable only LAN SSH on the running exact H300s debug firmware."""
import hashlib, http.client, importlib.util, json, os, re, secrets, subprocess, time
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parent; TARGET="192.168.2.1"; IFACE=b"enp44s0\0"
spec=importlib.util.spec_from_file_location("net",ROOT/"local-router-access.py")
net=importlib.util.module_from_spec(spec); spec.loader.exec_module(net)
class C(http.client.HTTPConnection):
    def connect(self):
        import socket
        self.sock=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.setsockopt(socket.SOL_SOCKET,socket.SO_BINDTODEVICE,IFACE)
        self.sock.connect((TARGET,80))
cookies=SimpleCookie(); cookies["login_uid"]="0."+str(secrets.randbelow(10**15)); token=""
def ck(): return "; ".join(f"{k}={v.value}" for k,v in cookies.items())
def req(method,path,body=None,ctype=None):
    global token
    q=urlencode({"_":int(time.time()*1000),"csrf_token":token}) if token else ""
    h={"Host":TARGET,"User-Agent":"Mozilla/5.0 Chrome/130","Accept-Language":"en-US,en;q=0.9","Connection":"close","Cookie":ck()}
    if body is not None:
        h["Content-Type"]=ctype or "application/x-www-form-urlencoded"; h["Content-Length"]=str(len(body))
    c=C(TARGET,timeout=30)
    try:
        c.request(method,path+("?"+q if q else ""),body=body,headers=h); r=c.getresponse(); d=r.read()
        for k,v in r.getheaders():
            if k.lower()=="set-cookie": cookies.load(v)
        if path in ("/login.html","/overview.html"):
            m=re.search(rb"\bcsrf_token\s*=\s*['\"]([^'\"]+)",d)
            if m: token=m.group(1).decode()
        return r.status,d
    finally: c.close()
st,_=req("GET","/login.html"); assert st==200 and token
st,d=req("GET","/data/login.json"); info={k:v for row in json.loads(d) for k,v in row.items()}; ch=info["challenge"]
xml=ET.parse(ROOT/"firmware-analysis/Vodafone_H_300s_v1.2.02.08/default_GR.decrypted.xml")
pwd=os.environ.get("H300S_PASSWORD") or next(vals.get("Password") for n in xml.iter() for vals in [{c.attrib.get("name"):c.attrib.get("value") for c in n}] if vals.get("UserName")=="superuser")
req("POST","/data/reset.json",b"chk_sys_busy=", "application/x-www-form-urlencoded")
login=urlencode({"LoginName":"superuser","LoginPWD":hashlib.sha256((pwd+ch).encode()).hexdigest(),"challenge":ch}).encode(); st,d=req("POST","/data/login.json",login)
if st!=200 or d.strip().strip(b'"')!=b"1": raise SystemExit(f"login failed {st} {d!r}")
req("GET","/overview.html")
st,d=req("GET","/data/user_data.json"); role={k:v for row in json.loads(d) for k,v in row.items()}; print("role",role)
if os.environ.get("H300S_CHECK_ONLY")=="1": raise SystemExit(0)
if os.environ.get("H300S_REBOOT")=="1":
    st,d=req("POST","/data/statussupportrestart.json",urlencode({"restart_device":"1"}).encode(),"application/x-www-form-urlencoded")
    print("reboot",st,d[:200],flush=True)
    raise SystemExit(0)
if os.environ.get("H300S_SHOW_PASSWORD_DATA")=="1":
    st,d=req("GET","/data/settings_password.json")
    print("password-data",st,d[:2000],flush=True)
    raise SystemExit(0)
if os.environ.get("H300S_SET_SUPERUSER_PASSWORD"):
    new_pwd = os.environ["H300S_SET_SUPERUSER_PASSWORD"]
    payload = json.dumps([{"user_id":"1","pwd":new_pwd}], separators=(",", ":"))
    sid = cookies.get("session_id").value if cookies.get("session_id") else ""
    if not sid: raise SystemExit("no session_id cookie")
    sjcl = subprocess.run(["node", "-e", "const s=require(process.argv[1]); process.stdout.write(s.encrypt(process.argv[2],process.argv[3]));", str(ROOT/"firmware-analysis/current-debug-research/rootfs/usr/www-ap/js/sjcl.js"), sid, payload], check=True, capture_output=True, text=True).stdout
    st,d=req("POST","/data/settings_password.json",urlencode({"PasswordUserData":sjcl,"auto_logout":"501007"}).encode(),"application/x-www-form-urlencoded")
    print("password-update",st,d[:200],flush=True)
    raise SystemExit(0)
st,d=req("GET","/data/settings_access_control.json"); rows=json.loads(d); vals={k:v for row in rows for k,v in row.items()}; print("before",{k:vals.get(k) for k in ("ssh_status","ssh_lan","ssh_wan")})
st,d=req("GET","/data/settings_password.json")
try:
    rows=json.loads(d); print("password-accounts",st,[{k:v for k,v in row.items() if k.lower() in ("username","user_id","userid","group","permission")} for row in rows if isinstance(row,dict)])
except Exception: print("password-data-status",st,len(d))
fields={k:str(vals.get(k,"deny")) for k in ("icmp_wan","icmp_lan","ssh_wan","ssh_lan","http_wan","http_lan","tr069_wan","tr069_lan","trusted_network_list")}
fields["ssh_wan"]="deny"; fields["ssh_lan"]="allow"
if os.environ.get("H300S_TRY_TELNET") == "1":
    fields["telnet_wan"]="deny"; fields["telnet_lan"]="allow"
st,d=req("POST","/data/settings_access_control.json",urlencode(fields).encode(),"application/x-www-form-urlencoded"); print("setter",st,d[:200])
time.sleep(3); st,d=req("GET","/data/settings_access_control.json"); vals={k:v for row in json.loads(d) for k,v in row.items()}; print("after",{k:vals.get(k) for k in ("ssh_status","ssh_lan","ssh_wan")})
