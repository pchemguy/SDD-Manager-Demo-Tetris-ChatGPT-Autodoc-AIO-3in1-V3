"""Reproducible project-owned PNG icons; no external image/tool dependency."""
from pathlib import Path
import struct,zlib,binascii
root=Path(__file__).resolve().parents[1]/'platforms/icons'
root.mkdir(parents=True,exist_ok=True)
def chunk(kind,data):return struct.pack('!I',len(data))+kind+data+struct.pack('!I',binascii.crc32(kind+data)&0xffffffff)
for size in [16,32,48,128]:
    pixels=[]
    for y in range(size):
        row=bytearray([0])
        for x in range(size):
            cell=(x*8//size,y*8//size)
            filled=cell in {(2,2),(3,2),(4,2),(3,3)}
            edge=x%(size//8)==0 or y%(size//8)==0
            row.extend((91,220,206,255) if filled and not edge else (36,116,118,255) if filled else (15,23,42,255))
        pixels.append(row)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(pixels),9))+chunk(b'IEND',b'')
    (root/f'tetris-{size}.png').write_bytes(png)
