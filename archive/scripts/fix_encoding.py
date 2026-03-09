#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复文件编码问题
"""

def fix_encoding():
    # 读取原始字节
    with open('index.html', 'rb') as f:
        raw = f.read()
    
    print(f"File size: {len(raw)} bytes")
    print(f"First 3 bytes: {raw[:3].hex()}")
    
    # 去掉BOM（如果有）
    if raw[:3] == b'\xef\xbb\xbf':
        raw = raw[3:]
        print("Removed UTF-8 BOM")
    
    # 尝试不同编码
    encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'latin1']
    
    for enc in encodings:
        try:
            text = raw.decode(enc)
            chinese_chars = [c for c in text[:10000] if '\u4e00' <= c <= '\u9fff']
            print(f"\n{enc}: Found {len(chinese_chars)} Chinese chars")
            if chinese_chars:
                sample = ''.join(chinese_chars[:20])
                print(f"  Sample: {sample}")
                
                # 如果找到了足够的中文，保存为UTF-8
                if len(chinese_chars) > 100:
                    # 添加BOM
                    with open('index.html', 'wb') as f:
                        f.write(b'\xef\xbb\xbf')
                        f.write(text.encode('utf-8'))
                    print(f"  -> SAVED as UTF-8 with BOM!")
                    return True
        except Exception as e:
            print(f"{enc}: Error - {str(e)[:80]}")
    
    # 如果所有编码都失败，可能是双重编码问题
    print("\nTrying double-encoding recovery...")
    try:
        # 先当作latin1读取（无损）
        text_latin1 = raw.decode('latin1')
        
        # 然后尝试用其他编码解码这个字符串的byte表示
        for enc2 in ['gbk', 'gb2312', 'utf-8']:
            try:
                text2 = text_latin1.encode('latin1').decode(enc2)
                chinese_chars2 = [c for c in text2[:10000] if '\u4e00' <= c <= '\u9fff']
                print(f"latin1->{enc2}: Found {len(chinese_chars2)} Chinese chars")
                if chinese_chars2 and len(chinese_chars2) > 100:
                    sample2 = ''.join(chinese_chars2[:20])
                    print(f"  Sample: {sample2}")
                    
                    with open('index.html', 'wb') as f:
                        f.write(b'\xef\xbb\xbf')
                        f.write(text2.encode('utf-8'))
                    print(f"  -> RECOVERED and saved!")
                    return True
            except Exception as e2:
                print(f"  latin1->{enc2}: {str(e2)[:60]}")
    except Exception as e:
        print(f"Double-encoding recovery failed: {e}")
    
    return False

if __name__ == '__main__':
    success = fix_encoding()
    print(f"\nRecovery {'SUCCESS' if success else 'FAILED'}")
