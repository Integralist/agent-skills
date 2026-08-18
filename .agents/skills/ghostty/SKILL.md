---
name: ghostty
description: >-
  Control Ghostty terminal (macOS) via AppleScript to manage panes, tabs,
  and windows. Use when splitting the terminal, opening new tabs or windows,
  running commands or tests out-of-band in a separate pane, spawning visible
  subagents or interactive tools, sending keystrokes or text to a pane, or
  inspecting active Ghostty terminals.
---

# Ghostty Terminal Automation

Automate Ghostty layout, tabs, splits, and process execution on macOS using
AppleScript (`osascript`).

Reserve out-of-band splits and new tabs for heavy tasks: long-running suites
(`make test-integration`, e2e, Docker builds), dev servers/watchers, interactive
TUIs, or visual subagents.

## When Not to Use

- **Fast or low-output commands:** Single unit tests, `git` commands, file
  checks, or anything completing in \<3s with \<50 lines of output. Run these
  directly in standard tool execution (`bash`) to avoid AppleScript overhead.
- **Non-macOS platforms:** Ghostty on Linux does not support AppleScript.
- **Headless CI or SSH sessions:** Where Ghostty is not the local host terminal.
- **Reading terminal scrollback directly:** Ghostty's AppleScript API does not
  expose terminal buffer text. Always redirect output to log files.

______________________________________________________________________

## Preflight & Permissions

Ghostty AppleScript control requires macOS Automation permissions (TCC) and
Ghostty 1.4.0+ for `tty`/`pid` properties. Run preflight probes to verify
connectivity and version:

```bash
# 1. Probe reachability & macOS Automation (TCC) permission
osascript -e '
with timeout of 5 seconds
  tell application "Ghostty" to get version
end timeout' >/dev/null 2>&1 || {
  echo "Ghostty unreachable: ensure Ghostty is running, macos-applescript is not false, and Automation permissions are granted."
  exit 1
}

# 2. Probe terminal properties & version support (1.4.0+)
TERM_COUNT=$(osascript -e 'tell application "Ghostty" to return count of terminals' 2>/dev/null)
if [ "${TERM_COUNT:-0}" -gt 0 ]; then
  osascript -e 'tell application "Ghostty" to get tty of first terminal' >/dev/null 2>&1 || {
    echo "Requires Ghostty 1.4.0+ (tty and pid properties absent on terminal class)."
    exit 1
  }
fi
```

______________________________________________________________________

## State Persistence

Agent harnesses execute each tool call in an isolated subshell. State variables
do not survive across separate conversation turns. Persist single-slot handles
(`last-pane`, `last-job`) to a user-scoped temporary directory:

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
mkdir -p "$STATE_DIR"
```

> [!NOTE]
> `last-pane` is a single-slot handle representing the most recently created or
> targeted pane. Launching a new job or split overwrites this handle.

______________________________________________________________________

## Resolving the Target Terminal

Ghostty registers all active terminals (standard windows and Quick Terminal
overlays) under `every terminal`. Extract the caller TTY from session processes
(checking child `$$` then parent `$PPID`), falling back to the front window if
no TTY is present:

```bash
tty_dev=$(ps -o tty= -p $$ 2>/dev/null | grep -v '?' | tr -d ' ')
[ -n "$tty_dev" ] || tty_dev=$(ps -o tty= -p $PPID 2>/dev/null | grep -v '?' | tr -d ' ')
case "$tty_dev" in
  '') TTY_DEV="" ;;
  *)  TTY_DEV="/dev/$tty_dev" ;;
esac
```

______________________________________________________________________

## Configuration Reference (`surface configuration`)

| Property                    | Type | Description                                        |
| :-------------------------- | :--- | :------------------------------------------------- |
| `initial working directory` | text | Working directory for the process.                 |
| `font size`                 | real | Font size in points.                               |
| `command`                   | text | Executable script or binary path (skips `.zshrc`). |
| `wait after command`        | bool | Keep pane open after `command` exits.              |
| `initial input`             | text | Text sent to the interactive shell after launch.   |
| `environment variables`     | list | List of `"KEY=VALUE"` strings.                     |

> [!NOTE]
> **`command` vs `initial input`:**
>
> - Setting `command` runs a direct non-interactive binary or runner script
>   (skipping `~/.zshrc`, which avoids 1Password, Touch ID, or startup rc
>   prompts). Setting `wait after command: true` keeps the pane open for review
>   until dismissed or closed by ID.
> - Setting `initial input` launches your default login shell and types into it,
>   loading full shell aliases and rc files.

______________________________________________________________________

## Creating Splits, Tabs, and Windows

Always pass variables as positional arguments (`argv`) to avoid escaping bugs.

### 1. Interactive Split Pane

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
mkdir -p "$STATE_DIR"

tty_dev=$(ps -o tty= -p $$ 2>/dev/null | grep -v '?' | tr -d ' ')
[ -n "$tty_dev" ] || tty_dev=$(ps -o tty= -p $PPID 2>/dev/null | grep -v '?' | tr -d ' ')
case "$tty_dev" in '') TTY_DEV="" ;; *) TTY_DEV="/dev/$tty_dev" ;; esac
TARGET_DIR="$PWD"
INIT_INPUT="echo 'hello from split'"

TARGET_ID=$(osascript - "$TTY_DEV" "$TARGET_DIR" "$INIT_INPUT" <<'APPLESCRIPT'
on run argv
  set targetTty to item 1 of argv
  set targetDir to item 2 of argv
  set initInput to item 3 of argv
  tell application "Ghostty"
    if targetTty is not "" and (count of (terminals whose tty is targetTty)) > 0 then
      set myTerm to (first terminal whose tty is targetTty)
    else
      set myTerm to focused terminal of selected tab of front window
    end if
    set cfg to new surface configuration
    set initial working directory of cfg to targetDir
    if initInput is not "" then
      set initial input of cfg to initInput & linefeed
    end if
    set newTerm to split myTerm direction right with configuration cfg
    return id of newTerm
  end tell
end run
APPLESCRIPT
)

[ -n "$TARGET_ID" ] || { echo "Failed to create split surface; check preflight."; exit 1; }
printf '%s\n' "$TARGET_ID" > "$STATE_DIR/last-pane"
```

Directions: `right`, `down`, `left`, `up`.

### 2. Create New Tab (Guarded for Quick Terminal)

> [!WARNING]
> **Quick Terminal Tab Restriction:**
> Ghostty does not support tabs in the Quick Terminal overlay. Calling
> `new tab` while in the Quick Terminal displays a blocking modal dialog.
> Guard against this by checking window membership:

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
mkdir -p "$STATE_DIR"

tty_dev=$(ps -o tty= -p $$ 2>/dev/null | grep -v '?' | tr -d ' ')
[ -n "$tty_dev" ] || tty_dev=$(ps -o tty= -p $PPID 2>/dev/null | grep -v '?' | tr -d ' ')
case "$tty_dev" in '') TTY_DEV="" ;; *) TTY_DEV="/dev/$tty_dev" ;; esac

TARGET_ID=$(osascript - "$TTY_DEV" "$PWD" <<'APPLESCRIPT'
on run argv
  set targetTty to item 1 of argv
  set targetDir to item 2 of argv
  tell application "Ghostty"
    if targetTty is not "" and (count of (terminals whose tty is targetTty)) > 0 then
      set myTerm to (first terminal whose tty is targetTty)
    else
      set myTerm to focused terminal of selected tab of front window
    end if

    set isQuickTerm to true
    set parentWin to missing value
    repeat with w in (every window)
      if (count of (terminals of w whose id is (id of myTerm))) > 0 then
        set isQuickTerm to false
        set parentWin to w
        exit repeat
      end if
    end repeat

    set cfg to new surface configuration
    set initial working directory of cfg to targetDir

    if isQuickTerm or parentWin is missing value then
      -- Quick Terminal: fallback to new standalone window
      set newWin to new window with configuration cfg
      return id of (focused terminal of (selected tab of newWin))
    else
      -- Standard Window: open new tab in parent window
      set newTab to new tab in parentWin with configuration cfg
      return id of (focused terminal of newTab)
    end if
  end tell
end run
APPLESCRIPT
)

[ -n "$TARGET_ID" ] || { echo "Failed to create tab surface; check preflight."; exit 1; }
printf '%s\n' "$TARGET_ID" > "$STATE_DIR/last-pane"
```

### 3. Create Standalone Window

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
mkdir -p "$STATE_DIR"

TARGET_ID=$(osascript - "$PWD" <<'APPLESCRIPT'
on run argv
  set targetDir to item 1 of argv
  tell application "Ghostty"
    set cfg to new surface configuration
    set initial working directory of cfg to targetDir
    set newWin to new window with configuration cfg
    return id of (focused terminal of (selected tab of newWin))
  end tell
end run
APPLESCRIPT
)

[ -n "$TARGET_ID" ] || { echo "Failed to create window; check preflight."; exit 1; }
printf '%s\n' "$TARGET_ID" > "$STATE_DIR/last-pane"
```

______________________________________________________________________

## Out-of-Band Job Execution Pattern

Run heavy test suites or builds out-of-band to prevent token bloat in the agent
context window. Write the command to a temporary runner script and pass the log
path via `environment variables`:

### Step 1: Launch the Out-of-Band Job

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
mkdir -p "$STATE_DIR"
TIMESTAMP=$(date +%s)
RUNNER_SCRIPT="$STATE_DIR/runner-$TIMESTAMP.sh"
LOG_FILE="$STATE_DIR/job-$TIMESTAMP.log"

cat << 'EOF' > "$RUNNER_SCRIPT"
#!/bin/bash
set -o pipefail
: "${GHOSTTY_JOB_LOG:?GHOSTTY_JOB_LOG environment variable not set}"
{
  # Insert actual heavy command here
  make test-integration

  EXIT=$?
  command -v terminal-notifier >/dev/null 2>&1 && terminal-notifier \
    -title "Ghostty Task" \
    -message "Finished with exit code $EXIT" \
    -activate com.mitchellh.ghostty \
    -sound default
  echo "__EXIT__:$EXIT"
} 2>&1 | tee "$GHOSTTY_JOB_LOG"
EOF
chmod +x "$RUNNER_SCRIPT"

tty_dev=$(ps -o tty= -p $$ 2>/dev/null | grep -v '?' | tr -d ' ')
[ -n "$tty_dev" ] || tty_dev=$(ps -o tty= -p $PPID 2>/dev/null | grep -v '?' | tr -d ' ')
case "$tty_dev" in '') TTY_DEV="" ;; *) TTY_DEV="/dev/$tty_dev" ;; esac

JOB_TERM_ID=$(osascript - "$TTY_DEV" "$PWD" "$RUNNER_SCRIPT" "$LOG_FILE" <<'APPLESCRIPT'
on run argv
  set targetTty to item 1 of argv
  set targetDir to item 2 of argv
  set runnerPath to item 3 of argv
  set logPath to item 4 of argv
  tell application "Ghostty"
    if targetTty is not "" and (count of (terminals whose tty is targetTty)) > 0 then
      set myTerm to (first terminal whose tty is targetTty)
    else
      set myTerm to focused terminal of selected tab of front window
    end if
    set cfg to new surface configuration
    set initial working directory of cfg to targetDir
    set command of cfg to runnerPath
    set environment variables of cfg to {"GHOSTTY_JOB_LOG=" & logPath}
    set wait after command of cfg to true
    set newTerm to split myTerm direction right with configuration cfg
    return id of newTerm
  end tell
end run
APPLESCRIPT
)

[ -n "$JOB_TERM_ID" ] || { echo "Failed to launch job surface."; exit 1; }

# Persist job state and pane target for future turns
printf 'LOG_FILE=%s\nJOB_TERM_ID=%s\nRUNNER=%s\n' \
  "$LOG_FILE" "$JOB_TERM_ID" "$RUNNER_SCRIPT" > "$STATE_DIR/last-job"
printf '%s\n' "$JOB_TERM_ID" > "$STATE_DIR/last-pane"

# Short initial check (up to 5s) in case command is fast
for _ in $(seq 1 5); do
  [ -f "$LOG_FILE" ] && grep -q '__EXIT__:' "$LOG_FILE" && break
  sleep 1
done
```

### Step 2: Idempotent Status Check & Harvest

Run this in subsequent turns to check progress, extract exit status, and close
the completed pane:

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
[ -f "$STATE_DIR/last-job" ] || { echo "No active Ghostty job recorded."; exit 1; }
. "$STATE_DIR/last-job"

ALIVE=$(osascript - "$JOB_TERM_ID" <<'APPLESCRIPT'
on run argv
  set targetId to item 1 of argv
  tell application "Ghostty"
    return (count of (terminals whose id is targetId))
  end tell
end run
APPLESCRIPT
)

if grep -q '__EXIT__:' "$LOG_FILE" 2>/dev/null; then
  EXIT_CODE=$(grep -o '__EXIT__:[0-9]*' "$LOG_FILE" | tail -1 | cut -d: -f2)
  echo "STATUS: DONE (exit $EXIT_CODE)"
  echo "--- Log Tail ---"
  tail -n 40 "$LOG_FILE"

  # Close completed pane
  osascript - "$JOB_TERM_ID" <<'APPLESCRIPT'
on run argv
  set targetId to item 1 of argv
  tell application "Ghostty"
    try
      close (first terminal whose id is targetId)
    end try
  end tell
end run
APPLESCRIPT

  # Clean runner script and terminal job state
  [ "$(cat "$STATE_DIR/last-pane" 2>/dev/null)" = "$JOB_TERM_ID" ] && rm -f "$STATE_DIR/last-pane"
  rm -f "$RUNNER" "$STATE_DIR/last-job"
elif [ "${ALIVE:-0}" = "0" ]; then
  echo "STATUS: ERROR — pane $JOB_TERM_ID closed or crashed before writing sentinel."
  [ -f "$LOG_FILE" ] && tail -n 40 "$LOG_FILE"
  [ "$(cat "$STATE_DIR/last-pane" 2>/dev/null)" = "$JOB_TERM_ID" ] && rm -f "$STATE_DIR/last-pane"
  rm -f "$RUNNER" "$STATE_DIR/last-job"
  exit 1
else
  LINE_COUNT=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
  echo "STATUS: RUNNING ($LINE_COUNT log lines generated so far in pane $JOB_TERM_ID)"
fi
```

______________________________________________________________________

## Interacting with a Target Pane

### 1. Send Text Input (Bracketed Paste Safe)

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
TARGET_ID=$(cat "$STATE_DIR/last-pane" 2>/dev/null)
[ -n "$TARGET_ID" ] || { . "$STATE_DIR/last-job" 2>/dev/null; TARGET_ID="$JOB_TERM_ID"; }
[ -n "$TARGET_ID" ] || { echo "No saved target pane."; exit 1; }

ALIVE=$(osascript - "$TARGET_ID" <<'APPLESCRIPT'
on run argv
  tell application "Ghostty" to return (count of (terminals whose id is (item 1 of argv)))
end run
APPLESCRIPT
)
[ "${ALIVE:-0}" != "0" ] || { echo "Saved pane $TARGET_ID no longer exists."; rm -f "$STATE_DIR/last-pane"; exit 1; }

osascript - "$TARGET_ID" "git status" <<'APPLESCRIPT'
on run argv
  set targetId to item 1 of argv
  set inputStr to item 2 of argv
  tell application "Ghostty"
    set targetTerm to (first terminal whose id is targetId)
    input text inputStr to targetTerm
    send key "enter" to targetTerm
  end tell
end run
APPLESCRIPT
```

### 2. Send Keystrokes & Modifiers

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
TARGET_ID=$(cat "$STATE_DIR/last-pane" 2>/dev/null)
[ -n "$TARGET_ID" ] || { . "$STATE_DIR/last-job" 2>/dev/null; TARGET_ID="$JOB_TERM_ID"; }
[ -n "$TARGET_ID" ] || { echo "No saved target pane."; exit 1; }

ALIVE=$(osascript - "$TARGET_ID" <<'APPLESCRIPT'
on run argv
  tell application "Ghostty" to return (count of (terminals whose id is (item 1 of argv)))
end run
APPLESCRIPT
)
[ "${ALIVE:-0}" != "0" ] || { echo "Saved pane $TARGET_ID no longer exists."; rm -f "$STATE_DIR/last-pane"; exit 1; }

osascript - "$TARGET_ID" <<'APPLESCRIPT'
on run argv
  set targetId to item 1 of argv
  tell application "Ghostty"
    set targetTerm to (first terminal whose id is targetId)
    send key "c" modifiers "control" to targetTerm
  end tell
end run
APPLESCRIPT
```

### 3. Close the Target Pane

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
TARGET_ID=$(cat "$STATE_DIR/last-pane" 2>/dev/null)
[ -n "$TARGET_ID" ] || { . "$STATE_DIR/last-job" 2>/dev/null; TARGET_ID="$JOB_TERM_ID"; }
[ -n "$TARGET_ID" ] || { echo "No saved target pane."; exit 1; }

ALIVE=$(osascript - "$TARGET_ID" <<'APPLESCRIPT'
on run argv
  tell application "Ghostty" to return (count of (terminals whose id is (item 1 of argv)))
end run
APPLESCRIPT
)
[ "${ALIVE:-0}" != "0" ] || { echo "Saved pane $TARGET_ID already closed."; rm -f "$STATE_DIR/last-pane"; exit 0; }

osascript - "$TARGET_ID" <<'APPLESCRIPT'
on run argv
  set targetId to item 1 of argv
  tell application "Ghostty"
    set targetTerm to (first terminal whose id is targetId)
    close targetTerm
  end tell
end run
APPLESCRIPT

rm -f "$STATE_DIR/last-pane"
```

______________________________________________________________________

## Inspection

List all active Ghostty surfaces, titles, TTYs, and foreground PIDs:

```bash
osascript -e '
tell application "Ghostty"
  set out to ""
  repeat with term in (every terminal)
    set out to out & (id of term) & " | TTY: " & (tty of term) & " | PID: " & (pid of term) & " | Name: " & (name of term) & linefeed
  end repeat
  return out
end tell'
```
