#!/usr/bin/env bash
# Build the extension into a .vsix and install it through VS Code's own CLI.
#
# `code --install-extension` is the supported path: VS Code writes its own
# installed-extensions list and copies the files in. Never symlink into
# ~/.vscode/extensions or edit extensions.json by hand — that file is the profile's
# installed-extensions list, not a cache, and editing it makes every other extension
# look uninstalled.
#
# vsce runs the `vscode:prepublish` script first, so packaging type-checks, lints and
# bundles before it builds the vsix. The vsix is never committed: what you install is
# always your current working tree.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

field() { sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" package.json | head -1; }
NAME="$(field name)"
VERSION="$(field version)"

command -v code >/dev/null 2>&1 || {
	echo "the 'code' CLI is not on PATH." >&2
	echo "In VS Code: Shell Command: Install 'code' command in PATH." >&2
	exit 1
}

if [ ! -x node_modules/.bin/vsce ]; then
	echo "vsce is missing — the packaging tool is a dev dependency." >&2
	echo "run:  npm install" >&2
	exit 1
fi

echo "packaging $NAME $VERSION (type check, lint and bundle run first)"
mkdir -p vsix
npm run --silent vsix >/dev/null

VSIX="vsix/$NAME-$VERSION.vsix"
[ -f "$VSIX" ] || { echo "expected $VSIX after packaging, but it is missing" >&2; exit 1; }

echo "installing $VSIX"
code --install-extension "$VSIX" --force

cat <<MSG

installed. Reload VS Code (Developer: Reload Window) to pick it up — a full quit is
only needed if the extension does not appear.
MSG
