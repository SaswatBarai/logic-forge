package languages

import (
	"github.com/logicforge/code-runner/sandbox"
)

type PythonStrategy struct{}

func (s *PythonStrategy) Compile(jobDir string, code string) (sandbox.ExecutionResult, error) {
	// Python is interpreted, so "compile" just writes the file
	err := WriteCodeFile(jobDir, "main.py", code)
	return sandbox.ExecutionResult{ExitCode: 0}, err
}

func (s *PythonStrategy) Run(jobDir string, input string, timeLimitMs int) (sandbox.ExecutionResult, error) {
	_, err := WriteInputFile(jobDir, input)
	if err != nil {
		return sandbox.ExecutionResult{}, err
	}

	// Read input.txt directly into stdin via bash
	cmdStr := "bash"
	args := []string{"-c", "python3 " + jobDir + "/main.py < " + jobDir + "/input.txt"}

	return sandbox.RunCommand(cmdStr, args, timeLimitMs)
}
