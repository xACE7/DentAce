#!/usr/bin/env python
"""DentAce — extract images from a PDF to a folder (deduped, tiny ones skipped, normalised to PNG).
Usage:  python extract-pdf-images.py <input.pdf> <output_dir>
Needs:  pypdf, pillow  (python -m pip install pypdf pillow)
"""
import sys
import os
import hashlib
import pypdf

if len(sys.argv) < 3:
    print("usage: python extract-pdf-images.py <input.pdf> <output_dir>")
    raise SystemExit(1)

src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
reader = pypdf.PdfReader(src)
seen = set()
n = 0
for pi, page in enumerate(reader.pages):
    try:
        imgs = list(page.images)
    except Exception:
        imgs = []
    for im in imgs:
        data = im.data
        h = hashlib.md5(data).hexdigest()
        if h in seen:
            continue
        seen.add(h)
        if len(data) < 4000:        # skip tiny icons/bullets
            continue
        name = f"p{pi + 1:02d}_{n:02d}.png"
        try:
            img = im.image
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")
            img.save(os.path.join(outdir, name))
        except Exception:
            ext = os.path.splitext(im.name)[1] or ".bin"
            name = f"p{pi + 1:02d}_{n:02d}{ext}"
            with open(os.path.join(outdir, name), "wb") as f:
                f.write(data)
        print(name, len(data))
        n += 1
print("SAVED:", n)
