package api

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/logicforge/code-runner/executor"
)

// Request payload shape matching `@logicforge/types` Submission schemas

func HandleExecute(c *gin.Context) {
	var req executor.ExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request payload",
				"details": err.Error(),
			},
		})
		return
	}

	// Apply defaults
	if req.TimeLimitMs <= 0 {
		req.TimeLimitMs = 5000 // 5 seconds
	}
	if req.MemoryLimitKb <= 0 {
		req.MemoryLimitKb = 262144 // 256MB
	}

	log.Printf("Executing [%s] code with %d test cases (TL: %dms)", req.Language, len(req.TestCases), req.TimeLimitMs)

	// Call the generic sandbox executor
	response, err := executor.RunPipeline(req)

	if err != nil {
		log.Printf("Execution pipeline failed critically: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "CODE_RUNNER_ERROR",
				"message": "Internal execution environment failed",
			},
		})
		return
	}

	c.JSON(http.StatusOK, response)
}
