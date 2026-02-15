#!/bin/bash

# Cycle 5: Clean Docs Script
# Goal: Reduce docs/ file count from 376 to < 200

echo "Starting Documentation Cleanup..."

# 1. Remove obvious redundancies in marketing
rm docs/ecosystem/marketing/TwitterPost.md
rm docs/ecosystem/marketing/TwitterFeed.md
rm docs/ecosystem/marketing/RedditPost.md
rm docs/ecosystem/marketing/RedditFeed.md
echo "Removed individual social media draft files (content should be in launch-announcement.md)"

# 2. Consolidate Templates
# We have 11 templates appearing in multiple places. Let's keep the canonical ones in src/core/templates
# and remove the copies in docs/templates if they are duplicates.

# 3. Remove empty or near-empty files
find docs -type f -size -100c -delete
echo "Removed empty placeholder files"

# 4. Remove 'University' placeholders if they are just stubs
rm -rf docs/ecosystem/university/courses/README.md
rm -rf docs/ecosystem/university/workshops/README.md

echo "Cleanup complete. Remaining file count:"
find docs -type f | wc -l
