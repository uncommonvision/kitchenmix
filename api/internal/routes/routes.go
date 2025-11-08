package routes

import (
	"github.com/gin-gonic/gin"
	"kitchenmix/api/internal/handlers"
	wsHandlers "kitchenmix/api/internal/handlers/websocket"
	"kitchenmix/api/internal/middleware"
)

func Setup(router *gin.Engine) {
	middleware.SetupLogger(router)
	middleware.SetupRecovery(router)
	middleware.SetupCORS(router)

	router.GET("/health", handlers.HealthCheck)

	api := router.Group("api/v1")
	{
		api.GET("/ws/:id", wsHandlers.HandleWebSocket)
	}
}
