import sys

path = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/meta-dashboard/backend/meta-dashboard/src/App.jsx"
with open(path, 'r') as f:
    content = f.read()

# Fix the internal closures to </>} (they don't have parentheses)
content = content.replace("        </>)}", "        </>}")

# Fix the final closure to </>)} (it HAS parentheses from line 1696)
# First find the end block
target = """          </>
        )}"""
# Wait, my script fix_syntax_v4.py already set it to:
# 2033: '          </>\n'
# 2034: '        )}\n'

# So 2033 and 2034 are already correct if 1696 is (

with open(path, 'w') as f:
    f.write(content)

print("Fixed App.jsx internal closures v5")
