package languages

import (
	"os"
	"path/filepath"

	"github.com/logicforge/code-runner/sandbox"
)

type LanguageStrategy interface {
	Compile(jobDir string, code string) (sandbox.ExecutionResult, error)
	Run(jobDir string, input string, timeLimitMs int) (sandbox.ExecutionResult, error)
}

func WriteCodeFile(jobDir string, filename string, code string) error {
	path := filepath.Join(jobDir, filename)
	return os.WriteFile(path, []byte(code), 0644)
}

func WriteInputFile(jobDir string, input string) (string, error) {
	path := filepath.Join(jobDir, "input.txt")
	err := os.WriteFile(path, []byte(input), 0644)
	return path, err
}
