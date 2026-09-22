#!/bin/sh
# Encode the couple's lossless files into something a phone on a hotel wifi can
# stream.
#
# The masters live in src/media and are not checked in: five FLACs run to about
# 200 MB, which is not a thing to put in a git repository or on a CDN. What
# ships is AAC in an MP4 container, which every browser in use has decoded for
# a decade, at around 135 kbps — transparent enough for music playing under a
# page and small enough that a track is 3.5 MB.
#
# afconvert is part of macOS, so there is no toolchain to install.
#
#   sh scripts/encode-audio.sh
#
# Then list the results in content.playlist.tracks.

set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
src="$root/src/media"
out="$root/public/audio"

if [ ! -d "$src" ]; then
  echo "no masters at $src — put the lossless files there first" >&2
  exit 1
fi

mkdir -p "$out"

for file in "$src"/*.flac "$src"/*.wav "$src"/*.m4a; do
  [ -e "$file" ] || continue
  base=$(basename "$file")
  # "02 - Girls Like You.flac" becomes "girls-like-you.m4a": the track number
  # is the couple's own album order and means nothing on the site, and the
  # parenthetical edition notes only make the URL harder to read.
  slug=$(printf '%s' "${base%.*}" |
    sed -e 's/^[0-9]* - //' -e 's/ ([^)]*)//g' |
    tr '[:upper:]' '[:lower:]' |
    tr ' ' '-')
  afconvert -f m4af -d aac -b 96000 -q 127 -s 3 "$file" "$out/$slug.m4a"
  printf '%s -> %s\n' "$base" "$slug.m4a"
done
