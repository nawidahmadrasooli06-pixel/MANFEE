#!/bin/bash
# راه‌انداز مشترک: ربات «آخرین واژه» (Python) پشت‌صحنه، و «منفی» (Node) برنامه‌ی اصلی.
# اگر LASTWORD_BOT_TOKEN تنظیم نشده یا پوشه‌ی lastword نیست، فقط منفی مثل قدیم بالا می‌آید.
LW=""
if [ -n "$LASTWORD_BOT_TOKEN" ] && [ -f lastword/bot.py ]; then
  (
    cd lastword || exit 0
    while true; do
      PYTHONPATH="$PWD/.deps" python3 -u bot.py
      echo "[lastword] متوقف شد؛ ۳۰ ثانیه بعد دوباره اجرا می‌شود"
      sleep 30
    done
  ) &
  LW=$!
else
  echo "[lastword] غیرفعال (LASTWORD_BOT_TOKEN یا lastword/bot.py موجود نیست)"
fi

node server.js &
NODE=$!
# سیگنال خاموش‌شدن Render را به Node برسان تا مثل قبل مرتب خاموش شود
trap 'kill -TERM "$NODE" 2>/dev/null' TERM INT
wait "$NODE"
CODE=$?
kill -TERM "$NODE" 2>/dev/null; wait "$NODE" 2>/dev/null
# با خاموش‌شدن منفی، آخرین واژه هم خاموش می‌شود (سرویس کامل ری‌استارت می‌شود)
if [ -n "$LW" ]; then
  pkill -P "$LW" 2>/dev/null
  kill "$LW" 2>/dev/null
fi
exit $CODE
