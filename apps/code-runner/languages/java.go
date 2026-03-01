package languages

import (
	"path/filepath"

	"github.com/logicforge/code-runner/sandbox"
)

type JavaStrategy struct{}

func (s *JavaStrategy) Compile(jobDir string, code string) (sandbox.ExecutionResult, error) {
	// The file name must match the public class name. For the MVP we assume Main.java
	err := WriteCodeFile(jobDir, "Main.java", code)
	if err != nil {
		return sandbox.ExecutionResult{}, err
	}

	cmdStr := "javac"
	args := []string{filepath.Join(jobDir, "Main.java")}

	// 10 second compilation timeout
	return sandbox.RunCommand(cmdStr, args, 10000)
}

func (s *JavaStrategy) Run(jobDir string, input string, timeLimitMs int) (sandbox.ExecutionResult, error) {
	_, err := WriteInputFile(jobDir, input)
	if err != nil {
		return sandbox.ExecutionResult{}, err
	}

	cmdStr := "bash"
	args := []string{"-c", "java -cp " + jobDir + " Main < " + filepath.Join(jobDir, "input.txt")}

	return sandbox.RunCommand(cmdStr, args, timeLimitMs)
}
