#!/usr/bin/env python3
"""Read fixed-layout setup.cgi dispatch table from verified H300s 1.2.02.08."""
from pathlib import Path
import argparse,hashlib,json,struct
p=argparse.ArgumentParser();p.add_argument('binary',type=Path);p.add_argument('--output',type=Path,required=True);args=p.parse_args();b=args.binary.read_bytes()
if b[:6]!=b'\x7fELF\x01\x02':raise SystemExit('Expected ELF32 big endian')
# VA->file offsets from readelf -WS for this exact artifact. Do not generalize to other binaries.
def string_at(v):
 o=v-(0x400000 if v<0x46e000 else 0x410000)
 if not 0<=o<len(b):return None
 e=b.find(b'\0',o);raw=b[o:e]
 return raw.decode() if 0<len(raw)<200 and all(32<=x<127 for x in raw) else None
rows=[]
for k in range((0x6e1c0-0x5f02c)//36):
 o=0x5f02c+k*36;w=struct.unpack_from('>9I',b,o);name=string_at(w[0])
 if name is None:break
 rows.append(dict(index=k,address=hex(o+0x410000),name=name,flags=hex(w[1]),validator=hex(w[2]),getter=hex(w[3]),setter=hex(w[4]),group_handler=hex(w[5]),tail=list(map(hex,w[6:]))))
assert rows[0]['name']=='about' and rows[477]['name']=='settings_access_control'
args.output.write_text(json.dumps({'sha256':hashlib.sha256(b).hexdigest(),'records':rows},indent=2)+'\n')
print('Extracted',len(rows),'records;',sum(r['flags']=='0x1000000' for r in rows),'groups')
