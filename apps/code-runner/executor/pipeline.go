package executor

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/logicforge/code-runner/languages"
)

// The unified response mapped to the TS schema `CodeExecutionResponseSchema`
type CodeExecutionResponse struct {
	Verdict              string       `json:"verdict"`
	TestResults          []TestResult `json:"testResults"`
	TotalExecutionTimeMs int          `json:"totalExecutionTimeMs"`
	CompilerOutput       *string      `json:"compilerOutput"`
}

type TestResult struct {
	Passed          bool    `json:"passed"`
	Input           string  `json:"input"`
	ExpectedOutput  string  `json:"expectedOutput"`
	ActualOutput    string  `json:"actualOutput"`
	ExecutionTimeMs int     `json:"executionTimeMs"`
	MemoryUsedKb    int     `json:"memoryUsedKb"`
}

// Re-declare to avoid cyclical deps with API package
type ExecuteRequest struct {
	Language      string      `json:"language" binding:"required"`
	Code          string      `json:"code" binding:"required"`
	TestCases     []TestCase  `json:"testCases" binding:"required"`
	TimeLimitMs   int         `json:"timeLimitMs"`
	MemoryLimitKb int         `json:"memoryLimitKb"`
}

type TestCase struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expectedOutput" binding:"required"`
}

func RunPipeline(req ExecuteRequest) (CodeExecutionResponse, error) {
	// 1. Create secure job workspace
	jobId := uuid.New().String()
	jobDir := filepath.Join("/tmp/sandbox", jobId)

	if err := os.MkdirAll(jobDir, 0777); err != nil {
		return CodeExecutionResponse{}, fmt.Errorf("failed to create sandbox directory: %w", err)
	}
	defer os.RemoveAll(jobDir) // Clean up automatically!

	// 2. Select Language Strategy
	var strategy languages.LanguageStrategy
	lang := strings.ToUpper(req.Language)
	switch lang {
	case "PYTHON":
		strategy = &languages.PythonStrategy{}
	case "CPP":
		strategy = &languages.CppStrategy{}
	case "JAVA":
		strategy = &languages.JavaStrategy{}
	default:
		return CodeExecutionResponse{Verdict: "COMPILE_ERROR"}, fmt.Errorf("unsupported language: %s", req.Language)
	}

	// 3. Compile (if applicable)
	compRes, err := strategy.Compile(jobDir, req.Code)
	if err != nil {
		return CodeExecutionResponse{}, fmt.Errorf("compilation process failed: %w", err)
	}

	if compRes.ExitCode != 0 {
		out := compRes.Stdout + "\n" + compRes.Stderr
		return CodeExecutionResponse{
			Verdict:        "COMPILE_ERROR",
			CompilerOutput: &out,
			TestResults:    []TestResult{},
		}, nil
	}

	// 4. Run Test Cases
	var testResults []TestResult
	overallVerdict := "CORRECT"
	totalTimeMs := 0

	for _, tc := range req.TestCases {
		execRes, _ := strategy.Run(jobDir, tc.Input, req.TimeLimitMs)
		totalTimeMs += execRes.DurationMs

		if execRes.Timeout {
			overallVerdict = "TIMEOUT"
			testResults = append(testResults, TestResult{
				Passed:          false,
				Input:           tc.Input,
				ExpectedOutput:  tc.ExpectedOutput,
				ActualOutput:    "Time Limit Exceeded",
				ExecutionTimeMs: execRes.DurationMs,
			})
			continue // Standard practice: fail fast or continue. We'll mark timeout and continue here for diagnostics.
		}

		if execRes.ExitCode != 0 {
			overallVerdict = "RUNTIME_ERROR"
			testResults = append(testResults, TestResult{
				Passed:          false,
				Input:           tc.Input,
				ExpectedOutput:  tc.ExpectedOutput,
				ActualOutput:    "Runtime Error: " + execRes.Stderr + "\n" + execRes.Stdout,
				ExecutionTimeMs: execRes.DurationMs,
			})
			continue
		}

		// Normalize outputs (trim whitespace for comparison)
		actual := strings.TrimSpace(execRes.Stdout)
		expected := strings.TrimSpace(tc.ExpectedOutput)
		passed := actual == expected

		if !passed && overallVerdict == "CORRECT" {
			overallVerdict = "INCORRECT"
		}

		testResults = append(testResults, TestResult{
			Passed:          passed,
			Input:           tc.Input,
			ExpectedOutput:  tc.ExpectedOutput,
			ActualOutput:    actual,
			ExecutionTimeMs: execRes.DurationMs,
		})
	}

	// Calculate partials if not entirely correct but not completely failing
	if overallVerdict == "INCORRECT" {
		passedCount := 0
		for _, tr := range testResults {
			if tr.Passed {
				passedCount++
			}
		}
		if passedCount > 0 {
			overallVerdict = "PARTIAL"
		}
	}

	log.Printf("Job %s completed. Verdict: %s, Time: %dms", jobId, overallVerdict, totalTimeMs)

	// In Go, empty pointer values are safely marshaled to null when omitted from explicit pointers.
	var compilerOut *string
	if compRes.Stdout != "" || compRes.Stderr != "" {
		s := compRes.Stdout + "\n" + compRes.Stderr
		compilerOut = &s
	}

	return CodeExecutionResponse{
		Verdict:              overallVerdict,
		TestResults:          testResults,
		TotalExecutionTimeMs: totalTimeMs,
		CompilerOutput:       compilerOut,
	}, nil
}
