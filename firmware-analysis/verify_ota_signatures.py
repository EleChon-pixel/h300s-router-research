#!/usr/bin/env python3
"""Offline verification only; never executes firmware or touches a router."""
from pathlib import Path
import hashlib,json,subprocess
base=Path(__file__).resolve().parent
key=base/'Vodafone_H_300s_v1.2.02.08/rootfs/usr/etc/signature_public.key'
results=[]
for name in ['Vodafone_H_300s_v1.2.02.08','current-debug-research','older-stock-research']:
    directory=base/name
    data=(directory/'decrypted-validated.bin').read_bytes()
    signature=data[-262144+1536:-262144+1792]
    assert len(signature)==256
    signature_path=directory/'ota-signature.bin'
    signature_path.write_bytes(signature)
    run=subprocess.run(['openssl','dgst','-sha256','-verify',str(key),'-signature',str(signature_path),str(directory/'kernel_rootfs.ubi')],capture_output=True,text=True)
    header=bytes.fromhex(data[:112].decode())
    results.append(dict(image=name,returncode=run.returncode,result=run.stdout.strip(),error=run.stderr.strip(),signature_sha256=hashlib.sha256(signature).hexdigest(),hardware_id=header[4:8].hex(),product_id=header[38:42].hex(),key_sha256=hashlib.sha256(key.read_bytes()).hexdigest()))
(base/'ota-signature-validation.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
raise SystemExit(any(r['returncode'] for r in results))
