from pathlib import Path

path = Path('.github/p0_patch.py')
text = path.read_text(encoding='utf-8')

bad_date = '    """\\];\n'
good_date = '    """];\n'
if bad_date not in text:
    raise SystemExit('Expected date helper escape not found')
text = text.replace(bad_date, good_date, 1)

old_regex = '        r"catch \\((e|err)\\) \\{\\n(?P<indent>\\s+)console\\.error\\((?P<message>[^\\n]+)\\);\\n(?P=indent)\\}"\n'
new_regex = '        r"catch \\((e|err)\\) \\{\\n(?P<indent>\\s+)console\\.error\\((?P<message>[^\\n]+)\\);\\n\\s+\\}"\n'
if old_regex not in text:
    raise SystemExit('Expected catch regex not found')
text = text.replace(old_regex, new_regex, 1)

old_guard = """    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)
"""
new_guard = """    count = text.count(old)
    if label in {'History current month WIB', 'fadeInUp stacking context cleanup'} and count == 2:
        return text.replace(old, new)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)
"""
if old_guard not in text:
    raise SystemExit('Expected replace_once guard not found')
text = text.replace(old_guard, new_guard, 1)

path.write_text(text, encoding='utf-8')
