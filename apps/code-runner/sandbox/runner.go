package sandbox

import (
	"context"
	"fmt"
	"os/exec"
	"time"
)

type ExecutionResult struct {
	Stdout       string
	Stderr       string
	ExitCode     int
	DurationMs   int
	Timeout      bool
	MemoryExceeded bool
}

// RunCommand with timeout boundaries
func RunCommand(cmdStr string, args []string, timeLimitMs int) (ExecutionResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeLimitMs)*time.Millisecond)
	defer cancel()

	cmd := exec.CommandContext(ctx, cmdStr, args...)
	
	start := time.Now()
	// Combined output handles simpler parsing for this MVP.
	// In production, split out stdout vs stderr for detailed reporting.
	output, err := cmd.CombinedOutput()
	duration := time.Since(start).Milliseconds()

	result := ExecutionResult{
		Stdout:     string(output),
		DurationMs: int(duration),
	}

	if ctx.Err() == context.DeadlineExceeded {
		result.Timeout = true
		result.ExitCode = 124 // Standard timeout exit code
		return result, nil
	}

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitError.ExitCode()
			result.Stderr = exitError.Error()
		} else {
			return result, fmt.Errorf("failed to execute command: %w", err)
		}
	} else {
		result.ExitCode = 0
	}

	return result, nil
}
