#!/bin/bash

# Remove the sensitive data from all commits
git filter-branch --force --index-filter \
"git rm --cached --ignore-unmatch \
src/scripts/register.mjs \
src/scripts/register.cjs \
src/scripts/register.js \
src/scripts/test_verify.js \
src/scripts/test_verify.cjs \
src/scripts/test_verify.ts \
dist/test_verify.js" \
--prune-empty --tag-name-filter cat -- --all

# Force push the changes
git push origin --force --all 