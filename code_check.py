# -*- coding: utf-8 -*-
import re

def check_code_consistency(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')
    
    print("=" * 60)
    print("Code Consistency Check Report")
    print("=" * 60)
    
    # 1. Bracket matching
    print("\n1. BRACKET MATCHING:")
    braces_open = content.count('{')
    braces_close = content.count('}')
    print(f"   {{{braces_open}}} vs {{{braces_close}}} - {'OK' if braces_open == braces_close else 'MISMATCH: ' + str(braces_open - braces_close)}")
    
    parens_open = content.count('(')
    parens_close = content.count(')')
    print(f"   ({parens_open}) vs ({parens_close}) - {'OK' if parens_open == parens_close else 'MISMATCH: ' + str(parens_open - parens_close)}")
    
    brackets_open = content.count('[')
    brackets_close = content.count(']')
    print(f"   [{brackets_open}] vs [{brackets_close}] - {'OK' if brackets_open == brackets_close else 'MISMATCH: ' + str(brackets_open - brackets_close)}")
    
    # 2. Variable check
    print("\n2. VARIABLE CHECK:")
    vars_to_check = ['_weaponSelecting', 'weaponSelecting', 'activeUIWindow', 'credits', 'godMode']
    for var in vars_to_check:
        count = content.count(var)
        if count > 0:
            print(f"   {var}: {count} occurrences")
    
    # 3. HTML structure
    print("\n3. HTML STRUCTURE:")
    print(f"   <html>: {content.count('<html')}, </html>: {content.count('</html>')}")
    print(f"   <body>: {content.count('<body>')}, </body>: {content.count('</body>')}")
    print(f"   <script>: {content.count('<script>')}, </script>: {content.count('</script>')}")
    
    # 4. Class definitions
    print("\n4. CLASS DEFINITIONS:")
    class_pattern = r'class\s+(\w+)'
    classes = re.findall(class_pattern, content)
    print(f"   Found {len(classes)} classes")
    for cls in classes:
        print(f"      - {cls}")
    
    # 5. Function definitions
    print("\n5. FUNCTION/METHOD CHECK:")
    func_pattern = r'(\w+)\s*\([^)]*\)\s*{'
    methods = re.findall(func_pattern, content)
    unique_methods = list(set(methods))
    print(f"   Found {len(unique_methods)} unique function patterns")
    
    # 6. Event listeners
    print("\n6. EVENT LISTENERS:")
    print(f"   addEventListener: {content.count('addEventListener')} occurrences")
    print(f"   onclick: {content.count('onclick')} occurrences")
    print(f"   onkeydown: {content.count('onkeydown')} occurrences")
    
    # 7. Promise/async/await
    print("\n7. ASYNC PATTERNS:")
    print(f"   Promise: {content.count('Promise')} occurrences")
    print(f"   async: {content.count('async')} occurrences")
    print(f"   await: {content.count('await')} occurrences")
    
    # 8. Debug code
    print("\n8. DEBUG CODE:")
    print(f"   console.log: {content.count('console.log')} occurrences")
    print(f"   console.warn: {content.count('console.warn')} occurrences")
    print(f"   console.error: {content.count('console.error')} occurrences")
    
    # 9. Check for common issues
    print("\n9. POTENTIAL ISSUES:")
    issues = []
    
    # Check for unclosed strings
    single_quotes = content.count("'")
    double_quotes = content.count('"')
    if single_quotes % 2 != 0:
        issues.append(f"   WARNING: Odd number of single quotes ({single_quotes})")
    if double_quotes % 2 != 0:
        issues.append(f"   WARNING: Odd number of double quotes ({double_quotes})")
    
    # Check for variable usage before definition patterns
    if '_weaponSelecting' in content:
        # Check if it's defined somewhere
        if 'let _weaponSelecting' not in content and 'var _weaponSelecting' not in content and 'const _weaponSelecting' not in content and 'this._weaponSelecting' not in content:
            issues.append("   WARNING: _weaponSelecting used but may not be properly defined")
    
    if not issues:
        print("   No obvious issues found")
    else:
        for issue in issues:
            print(issue)
    
    # 10. Line count
    print(f"\n10. FILE STATS:")
    print(f"   Total lines: {len(lines)}")
    print(f"   Non-empty lines: {len([l for l in lines if l.strip()])}")
    
    print("\n" + "=" * 60)
    print("Check Complete")
    print("=" * 60)

if __name__ == '__main__':
    check_code_consistency(r'E:\AI\game\rougelike-cow\index.html')
