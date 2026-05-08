import sys

path = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/meta-dashboard/backend/meta-dashboard/src/App.jsx"
with open(path, 'r') as f:
    content = f.read()

# Fix the closures back to </>} for those that don't use (
# Only the main sections should keep ) if they were opened with (
# Wait, I refactored the main sections to NOT use ( anyway in my last multi_replace.
# Let's check 1694.

fixed = content.replace("        </>)}", "        </>}")

with open(path, 'w') as f:
    f.write(fixed)

print("Fixed App.jsx closures")
