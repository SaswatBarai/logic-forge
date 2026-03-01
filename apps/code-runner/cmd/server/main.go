package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/logicforge/code-runner/api"
)

func main() {
	// Let Gin run in release mode for standard logging
	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	// Inter-service health check
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "code-runner",
		})
	})

	// Execute Code Endpoint
	r.POST("/api/v1/execute", api.HandleExecute)

	port := os.Getenv("PORT_CODE_RUNNER")
	if port == "" {
		port = "3004"
	}

	log.Printf("Code Runner API listening on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
