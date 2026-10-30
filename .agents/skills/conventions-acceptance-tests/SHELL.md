# Make and Bash Acceptance Tests

Prefer Godog for feature-driven acceptance tests, including Make/Bash
workflows. Go steps invoke the real targets or scripts and verify their
effects. The same runner reads API and command-workflow scenarios; keep shell
helpers for fixtures and command mechanics, not a separate acceptance
framework. Keep an established alternative Gherkin runner unless migration is
requested.

**Boundary.** Run the real Makefile or script. Use an isolated working
directory and environment; provide controlled command doubles on `PATH` when
external services or tools are outside the contract. Log arguments and effects
at those boundaries. A fake external command is useful; replacing the target
under test or inspecting source text instead of running it proves less. If a
target requires repository-relative paths, use an isolated checkout or keep
its working directory while directing mutable state to the workspace.

**Outcomes.** Capture command errors, stdout, and stderr separately. Keep an
expected nonzero exit for the Then steps to check; report launch errors and
timeouts as broken actions, not the expected rejection. Assert the promised
output, files, permissions, or dependency effects, not only exit zero or an
arbitrary error. For forbidden calls, check recorded invocations after proving
the intended target ran.

**Isolation.** Give each scenario a temporary workspace and a controlled
command environment. Clean up after each scenario, including when a step
fails. Keep real credentials and the developer's services out of the fixture.
Pass command arguments directly rather than constructing shell expressions.

**Processes.** Bound commands with context deadlines and pipe waits with
`Cmd.WaitDelay`. Poll observable readiness with a deadline rather than a fixed
sleep. `exec.CommandContext` only cancels the command it starts, not its whole
process tree. For targets that launch programs, register cleanup before
starting them, track the owned process tree, terminate it with a bounded
fallback, and reap it. Reuse the project's process helpers rather than adding
another process supervisor to the acceptance suite.

**Example.** Store the living feature at `docs/specs/<capability>.feature`,
named for the behaviour it owns. Place the runner and step implementations
according to the project's existing test layout. Adapt the
[Godog wiring example](../go-testing/ACCEPTANCE.md) to that layout, resolving
feature and Makefile paths from the actual test package.

The code's package name and concrete paths are illustrative, not required.
The existing project Makefile owns `render-config`; this test does not replace
that target. It writes JSON with `mode` set to `local`, or reports
`output path is not a directory` when that path names an existing file.

```gherkin
Feature: Render local configuration
  Scenario: Render a local configuration
    Given an empty output directory
    When the developer runs make render-config
    Then the configuration is available in local mode

  Scenario: Refuse an unusable output directory
    Given the output path is an existing file
    When the developer runs make render-config
    Then rendering is refused and the existing file is unchanged
```

The Go example needs Go 1.21 or later. Each scenario gets its own world and
workspace. The shared When is registered once; the following Then checks the
result. The helper is for a finite target; a server-starting target also needs
the process-tree cleanup described above.

```go
package workflow_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/cucumber/godog"
)

// commandWorld holds one scenario's workspace and command observations.
type commandWorld struct {
	// runErr distinguishes successful rendering from a rejected request.
	runErr error
	// stderr records diagnostics separately from ordinary output.
	stderr bytes.Buffer
	// stdout records ordinary output for contracts that assert it.
	stdout bytes.Buffer
	// workspace isolates generated files from the developer's checkout.
	workspace string
}

// initializeScenario mirrors feature order; Godog calls it for each scenario.
func initializeScenario(sc *godog.ScenarioContext) {
	// world keeps observations local to this scenario's step closures.
	world := &commandWorld{}
	// Before creates a fresh workspace, even if a later step fails.
	sc.Before(func(
		ctx context.Context, _ *godog.Scenario,
	) (context.Context, error) {
		// err reports fixture setup errors instead of passing an empty path.
		var err error
		world.workspace, err = os.MkdirTemp("", "render-config-")
		return ctx, err
	})
	// After removes the workspace on both successful and unsuccessful runs.
	sc.After(func(
		ctx context.Context, _ *godog.Scenario, _ error,
	) (context.Context, error) {
		return ctx, os.RemoveAll(world.workspace)
	})

	// Scenario: Render a local configuration
	sc.Step( /* Given */ `^an empty output directory$`, func() error {
		return os.Mkdir(filepath.Join(world.workspace, "output"), 0o700)
	})
	// Godog supplies the scenario context to the action's first argument.
	sc.Step( /* When  */ `^the developer runs make render-config$`, world.render)
	sc.Step( /* Then  */ `^the configuration is available in local mode$`,
		world.localConfigurationIsAvailable)

	// Scenario: Refuse an unusable output directory
	sc.Step( /* Given */ `^the output path is an existing file$`, func() error {
		return os.WriteFile(filepath.Join(world.workspace, "output"),
			[]byte("occupied\n"), 0o600)
	})
	// Reuses "the developer runs make render-config" registered above.
	sc.Step( /* Then  */ `^rendering is refused and the existing file is unchanged$`,
		world.renderingIsRefused)
}

// render runs the real target and preserves its outcome for the Then step.
func (w *commandWorld) render(ctx context.Context) error {
	// makefile uses an illustrative path; adapt it to the real test layout.
	// Resolve it before the command switches to the isolated workspace.
	makefile, err := filepath.Abs("../../../Makefile")
	if err != nil {
		return fmt.Errorf("acceptance: locate Makefile: %w", err)
	}
	// ctx bounds a finite target without a platform-specific timeout command.
	ctx, cancel := context.WithTimeoutCause(ctx, 5*time.Second,
		errors.New("acceptance: render-config timed out"))
	defer cancel()
	// command receives arguments directly, not through an interpolated shell.
	command := exec.CommandContext(ctx,
		"make", "--no-print-directory", "-f", makefile, "render-config",
		"OUTPUT_DIR="+filepath.Join(w.workspace, "output"),
	)
	command.Dir = w.workspace
	command.Env = []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + w.workspace,
		"TMPDIR=" + w.workspace,
		"LC_ALL=C",
	}
	command.Stdout = &w.stdout
	command.Stderr = &w.stderr
	// WaitDelay bounds inherited pipes; it does not clean up descendants.
	command.WaitDelay = time.Second
	w.runErr = command.Run()
	if cause := context.Cause(ctx); cause != nil {
		return fmt.Errorf("acceptance: run render-config: %w", cause)
	}
	if w.runErr != nil {
		// exitErr permits expected command rejections, not launch errors.
		var exitErr *exec.ExitError
		if !errors.As(w.runErr, &exitErr) {
			return fmt.Errorf("acceptance: start render-config: %w", w.runErr)
		}
	}
	return nil
}

// localConfigurationIsAvailable checks content, not merely a zero exit code.
func (w *commandWorld) localConfigurationIsAvailable() error {
	if w.runErr != nil {
		return fmt.Errorf("acceptance: render-config: %w; stdout: %s; stderr: %s",
			w.runErr, w.stdout.String(), w.stderr.String())
	}
	// configPath locates the file produced by the real Make target.
	configPath := filepath.Join(w.workspace, "output", "config.json")
	// content is parsed so whitespace changes do not break the assertion.
	content, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("acceptance: read configuration: %w", err)
	}
	// configuration keeps the assertion independent of JSON formatting.
	var configuration struct {
		// Mode selects local behaviour rather than the live service.
		Mode string `json:"mode"`
	}
	if err := json.Unmarshal(content, &configuration); err != nil {
		return fmt.Errorf("acceptance: parse configuration: %w", err)
	}
	if configuration.Mode != "local" {
		return fmt.Errorf("acceptance: expected local mode, got %q",
			configuration.Mode)
	}
	return nil
}

// renderingIsRefused checks the rejection reason and preservation guarantee.
func (w *commandWorld) renderingIsRefused() error {
	if w.runErr == nil || !strings.Contains(w.stderr.String(),
		"output path is not a directory") {
		return fmt.Errorf("acceptance: expected output-path rejection; %v; %s",
			w.runErr, w.stderr.String())
	}
	// content proves rejection preserved the pre-existing file.
	content, err := os.ReadFile(filepath.Join(w.workspace, "output"))
	if err != nil {
		return fmt.Errorf("acceptance: read existing output: %w", err)
	}
	if string(content) != "occupied\n" {
		return fmt.Errorf("acceptance: existing output changed to %q", content)
	}
	return nil
}
```
