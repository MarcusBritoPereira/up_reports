import sys

path = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/meta-dashboard/backend/meta-dashboard/src/App.jsx"
with open(path, 'r') as f:
    content = f.read()

# Fix the mismatched closures
fixed = content.replace("        </>}", "        </>)}")

with open(path, 'w') as f:
    f.write(fixed)

print("Fixed App.jsx")
