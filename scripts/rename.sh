#!/bin/bash

# Find all files and replace "BambiLand" with "Cursor Workflow"
grep -r -l "BambiLand" --include="*.md" --include="*.mdc" --include="*.js" --include="*.json" . | xargs sed -i '' 's/BambiLand/Cursor Workflow/g'

# Find all files and replace "bambiland" with "cursor-workflow"
grep -r -l "bambiland" --include="*.md" --include="*.mdc" --include="*.js" --include="*.json" . | xargs sed -i '' 's/bambiland/cursor-workflow/g'

# Find all files and replace "Bambi" with "Cursor"
grep -r -l "Bambi" --include="*.md" --include="*.mdc" --include="*.js" --include="*.json" . | xargs sed -i '' 's/Bambi/Cursor/g'

# Find all files and replace "bambi" with "cursor"
grep -r -l "bambi" --include="*.md" --include="*.mdc" --include="*.js" --include="*.json" . | xargs sed -i '' 's/bambi/cursor/g'

echo "Replacement complete. Please check the files for any remaining references." 