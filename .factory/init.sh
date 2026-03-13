#!/bin/bash
set -e

cd /home/shuv/repos/inbound

# Install dependencies if node_modules is missing or stale
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
  bun install
fi
