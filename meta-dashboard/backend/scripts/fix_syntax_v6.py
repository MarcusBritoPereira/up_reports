import sys

path = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/meta-dashboard/backend/meta-dashboard/src/App.jsx"
with open(path, 'r') as f:
    lines = f.readlines()

# Line 2033 is 0-indexed 2032
lines[2032] = "          </div>\n"
lines[2033] = "        )}\n"

with open(path, 'w') as f:
    f.writelines(lines)

print("Fixed final closure with div v6")
