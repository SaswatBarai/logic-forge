package languages

import (
	"path/filepath"

	"github.com/logicforge/code-runner/sandbox"
)

type CppStrategy struct{}

func (s *CppStrategy) Compile(jobDir string, code string) (sandbox.ExecutionResult, error) {
	err := WriteCodeFile(jobDir, "main.cpp", code)
	if err != nil {
		return sandbox.ExecutionResult{}, err
	}

	cmdStr := "g++"
	args := []string{"-O2", "-Wall", "-std=c++17", filepath.Join(jobDir, "main.cpp"), "-o", filepath.Join(jobDir, "a.out")}

	// 10 second compilation timeout
	return sandbox.RunCommand(cmdStr, args, 10000)
}

func (s *CppStrategy) Run(jobDir string, input string, timeLimitMs int) (sandbox.ExecutionResult, error) {
	_, err := WriteInputFile(jobDir, input)
	if err != nil {
		return sandbox.ExecutionResult{}, err
	}

	cmdStr := "bash"
	args := []string{"-c", filepath.Join(jobDir, "a.out") + " < " + filepath.Join(jobDir, "input.txt")}

	return sandbox.RunCommand(cmdStr, args, timeLimitMs)
}
