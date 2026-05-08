import sys

path = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/meta-dashboard/backend/meta-dashboard/src/App.jsx"
with open(path, 'r') as f:
    lines = f.readlines()

# Replace the block from 2033 to 2037 (0-indexed: 2032 to 2036)
# Check the content to be sure
print(f"Line 2033: {repr(lines[2032])}")
print(f"Line 2034: {repr(lines[2033])}")

lines[2032] = "          </>\n"
lines[2033] = "        )}\n"

with open(path, 'w') as f:
    f.writelines(lines)

print("Fixed final closure v4")
