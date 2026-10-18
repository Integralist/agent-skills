---
name: ghostty
description: >-
  Control the Ghostty terminal on macOS through AppleScript: panes, tabs, and
  windows. Use when splitting the terminal, opening a tab or window, running
  a long command or test suite out of band in another pane, spawning a
  visible subagent or interactive tool, sending text or keystrokes to a pane,
  or listing open Ghostty terminals.
metadata:
  model-tier: trivial
---

# Ghostty Terminal Automation

Drive Ghostty's splits, tabs, windows, and processes on macOS with
`osascript`, so heavy or interactive work runs in its own pane and only its
result comes back to the agent.

**When to use a pane.** Use one for long suites (`make test-integration`,
e2e, Docker builds), dev servers and watchers, interactive TUIs, and visible
subagents. Run anything that finishes in under 3 seconds with under 50 lines
of output (a single unit test, `git`, a file check) directly with the shell
tool. Ghostty's AppleScript works only on macOS with Ghostty as the local
terminal, so use the shell tool on Linux, in CI, or over SSH. The API can't
read a pane's scrollback, so redirect any output you need to a log file. When
a pane runs a subagent, follow
[SUBAGENT-STEERABILITY.md](../../../.agents/skills/shared/SUBAGENT-STEERABILITY.md), including its
completion and retry protocol, and confirm completion from its recorded
output before reporting success.

**Preflight.** Control needs macOS Automation (TCC) permission, and `tty`
and `pid` need Ghostty 1.4.0 or later. Probe both once:

```bash
osascript -e '
with timeout of 5 seconds
  tell application "Ghostty" to get version
end timeout' >/dev/null 2>&1 || {
  echo "Ghostty unreachable: ensure Ghostty is running, macos-applescript is not false, and Automation permissions are granted."
  exit 1
}

TERM_COUNT=$(osascript -e 'tell application "Ghostty" to return count of terminals' 2>/dev/null)
if [ "${TERM_COUNT:-0}" -gt 0 ]; then
  osascript -e 'tell application "Ghostty" to get tty of first terminal' >/dev/null 2>&1 || {
    echo "Requires Ghostty 1.4.0+ (tty and pid properties absent on terminal class)."
    exit 1
  }
fi
```

**State.** Each tool call runs in a fresh subshell, so persist handles in a
per-user directory. `last-pane` holds the most recently created or targeted
pane, and each new split or job overwrites it; `last-job` holds the running
job's log, pane, and runner script.

```bash
STATE_DIR="/tmp/ghostty-skill-$(id -u)"
mkdir -p "$STATE_DIR"
```

**Caller TTY.** Ghostty lists every terminal, including Quick Terminal
overlays, under `every terminal`. Find the caller's TTY from this shell or its
parent, so a new pane opens beside the caller; with no TTY, the scripts fall
back to the front window. Put this, with the state lines above, at the top of
each create or launch command below:

```bash
tty_dev=$(ps -o tty= -p $$ 2>/dev/null | grep -v '?' | tr -d ' ')
[ -n "$tty_dev" ] || tty_dev=$(ps -o tty= -p $PPID 2>/dev/null | grep -v '?' | tr -d ' ')
case "$tty_dev" in '') TTY_DEV="" ;; *) TTY_DEV="/dev/$tty_dev" ;; esac
```

Pass values to AppleScript as positional arguments (`argv`), never by
interpolating them into the script, to avoid escaping bugs.

## Surface configuration

| Property                    | Type | Description                                        |
| :-------------------------- | :--- | :------------------------------------------------- |
| `initial working directory` | text | Working directory for the process.                 |
| `font size`                 | real | Font size in points.                               |
| `command`                   | text | Executable script or binary path (skips `.zshrc`). |
| `wait after command`        | bool | Keep pane open after `command` exits.              |
| `initial input`             | text | Text sent to the interactive shell after launch.   |
| `environment variables`     | list | List of `"KEY=VALUE"` strings.                     |

Use `command` to run a binary or runner script without a login shell, which
skips `~/.zshrc` and the 1Password, Touch ID, or rc prompts it can trigger;
add `wait after command` to keep the pane open for review. Use
`initial input` to start your login shell with its aliases and type into it.

## Create a split, tab, or window

**Split.** Directions are `right`, `down`, `left`, and `up`.

```bash
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

**Tab.** The Quick Terminal has no tabs, and `new tab` there opens a blocking
modal dialog, so this script opens a window instead when the caller isn't in
a standard window:

```bash
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

**Window.**

```bash
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

## Run a job out of band

Run a heavy suite or build in its own pane so its output stays out of the
agent's context, then read only the result.

1. **Launch.** Write the command into a runner script, start it in a split
   with the log path in `environment variables`, and record the job:

   ```bash
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

   printf 'LOG_FILE=%s\nJOB_TERM_ID=%s\nRUNNER=%s\n' \
     "$LOG_FILE" "$JOB_TERM_ID" "$RUNNER_SCRIPT" > "$STATE_DIR/last-job"
   printf '%s\n' "$JOB_TERM_ID" > "$STATE_DIR/last-pane"

   # Short initial check (up to 5s) in case the command is fast
   for _ in $(seq 1 5); do
     [ -f "$LOG_FILE" ] && grep -q '__EXIT__:' "$LOG_FILE" && break
     sleep 1
   done
   ```

   Done when `last-job` is written.
2. **Check and harvest** on later turns. This is safe to repeat: it reports
   running, done with the exit code and log tail, or an error if the pane
   died before writing its sentinel, and on done or error it closes the pane
   and cleans up:

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

   Done when it reports done or error.

## Act on a saved pane

Start each of these with the target check, which loads `last-pane` (falling
back to the last job's pane) and stops if that pane is gone. When closing a
pane that's already gone, exit 0 instead, since the goal is met.

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
```

**Send text,** pasted safely, then Enter:

```bash
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

**Send a keystroke** with modifiers, such as Ctrl-C:

```bash
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

**Close the pane,** then clear `last-pane`:

```bash
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

## List terminals

Show each surface's ID, TTY, foreground PID, and title:

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
