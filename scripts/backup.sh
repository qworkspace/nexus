#!/bin/bash
# Nexus nightly backup script
# Commits and pushes source changes to GitHub

cd /Users/paulvillanueva/.openclaw/projects/nexus

# Add all changes (node_modules and dist excluded by .gitignore)
git add -A

# Commit with timestamp (skip if nothing to commit)
git diff --cached --quiet || git commit -m "Auto-backup $(date '+%Y-%m-%d %H:%M')"

# Push to origin
git push origin main

# Log the backup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed" >> /Users/paulvillanueva/.openclaw/projects/nexus/scripts/backup.log
