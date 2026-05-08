import sys

path = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/meta-dashboard/backend/meta-dashboard/src/App.jsx"
with open(path, 'r') as f:
    content = f.read()

# Fix the closures to </>)} since I now use ( <> for all main tabs
content = content.replace("        </>}", "        </>)}")

# Also fix the very end if it has double closures
# Actually, I'll check the end manually or fix it here
content = content.replace("          </>\n        )}", "          </>\n        )}")

with open(path, 'w') as f:
    f.write(content)

print("Fixed App.jsx closures v3")
