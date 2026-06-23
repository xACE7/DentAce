#!/usr/bin/env python
"""DentAce — extract a PDF's text to a UTF-8 file (for building lectures/tests).
Usage:  python extract-pdf.py <input.pdf> <output.txt>
Needs:  pypdf  (python -m pip install pypdf)
"""
import sys
import pypdf

if len(sys.argv) < 3:
    print("usage: python extract-pdf.py <input.pdf> <output.txt>")
    raise SystemExit(1)

reader = pypdf.PdfReader(sys.argv[1])
text = "\n".join((page.extract_text() or "") for page in reader.pages)
with open(sys.argv[2], "w", encoding="utf-8") as f:
    f.write(text)
print(f"pages {len(reader.pages)} chars {len(text)}")
