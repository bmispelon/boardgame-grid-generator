#!/bin/sh
set -e

# A simplistic build script for this static site:
# - Copy everything into a build directory (build/ by default)
# - Rename static files to include an md5 hash of their content
# - Rewrite the HTML files to point to the new name of the static files

STATICFILES="application.js styles.css"
HTMLFILES="index.html"
OTHERFILES="favicon.ico"
BUILDDIR=build


mkdir -p $BUILDDIR

for OTHERFILE in $OTHERFILES
do
  echo "Copying $OTHERFILE -> $BUILDDIR/$OTHERFILE"
  cp "$OTHERFILE" "$BUILDDIR/$OTHERFILE"
done

for HTMLFILE in $HTMLFILES
do
  echo "Copying $HTMLFILE -> $BUILDDIR/$HTMLFILE"
  cp "$HTMLFILE" "$BUILDDIR/$HTMLFILE"
done

for STATICFILE in $STATICFILES
do
  MD5=$(md5sum "$STATICFILE" | cut -d" " -f1)
  NEWFILENAME="${STATICFILE%.*}-$MD5.${STATICFILE##*.}"
  echo "Copying $STATICFILE -> $BUILDDIR/$NEWFILENAME"
  cp "$STATICFILE" "$BUILDDIR/$NEWFILENAME"

  for HTMLFILE in $HTMLFILES
  do
    sed -E -i "s/(src|href)=(.)$STATICFILE\2/\1=\2$NEWFILENAME\2/g" "$BUILDDIR/$HTMLFILE"
  done
done
