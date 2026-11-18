#!/bin/bash
# Relaunch Grok Bot with DevTools on (if needed) and apply the unlock.
cd "$(dirname "$0")"
PORT=${GB_PORT:-9339}
if ! curl -s --max-time 2 "http://127.0.0.1:$PORT/json/version" >/dev/null; then
  echo "Restarting Grok Bot with debugging on port $PORT..."
  osascript -e 'quit app "Grok Bot"' 2>/dev/null
  for i in $(seq 1 20); do pgrep -f "/Applications/Grok Bot.app/Contents/MacOS/Grok Bot" >/dev/null || break; sleep 1; done
  open -a "/Applications/Grok Bot.app" --args --remote-debugging-port=$PORT --remote-allow-origins=http://127.0.0.1
  for i in $(seq 1 30); do curl -s --max-time 1 "http://127.0.0.1:$PORT/json/list" | grep -q renderer && break; sleep 1; done
  sleep 6
fi
node unlock.js "$@"
