#!/bin/sh
set -e

# A simplistic build script for this static site:
# - Copy everything into a build directory (build/ by default)
# - Rename static files to include an md5 hash of their content
# - Rewrite the HTML files to point to the new name of the static files

STATICFILES="application.js styles.css"
HTMLFILES="index.html"
BUILDDIR=build


mkdir -p $BUILDDIR


for HTMLFILE in $HTMLFILES
do
  cp "$HTMLFILE" "$BUILDDIR/$HTMLFILE"
  echo "Rewriting staticfile links in $BUILDDIR/$HTMLFILE:"
  for STATICFILE in $STATICFILES
  do
    MD5=$(md5sum "$STATICFILE" | cut -d" " -f1)
    NEWFILENAME="${STATICFILE%.*}-$MD5.${STATICFILE##*.}"
    echo "  $STATICFILE -> $BUILDDIR/$NEWFILENAME"
    cp "$STATICFILE" "$BUILDDIR/$NEWFILENAME"
    sed -E -i "s/(src|href)=(.)$FILENAME\2/\1=\2$NEWFILENAME\2/g" "$BUILDDIR/$HTMLFILE"
  done
  echo "Done."
done
