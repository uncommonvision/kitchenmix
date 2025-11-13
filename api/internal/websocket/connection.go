package websocket

import (
	"encoding/json"
	"log"
	"time"

	"kitchenmix/api/internal/services/recipe"

	"github.com/gorilla/websocket"
)

// Initialize recipe service
var recipeService = recipe.NewRecipeService()

const (
	writeWait      = 10 * time.Second
	pongWait       = 30 * time.Second
	pingPeriod     = 24 * time.Second
	maxMessageSize = 512 * 1024
)

type Connection struct {
	ID       string
	UUID     string
	UserID   string
	UserName string
	Status   string
	Conn     *websocket.Conn
	Send     chan WSMessage
	LastPing time.Time
}

func NewConnection(id, uuid string, conn *websocket.Conn) *Connection {
	return &Connection{
		ID:       id,
		UUID:     uuid,
		UserID:   "",
		UserName: "",
		Status:   "Unidentified",
		Conn:     conn,
		Send:     make(chan WSMessage, 256),
		LastPing: time.Now(),
	}
}

func (c *Connection) ReadPump() {
	defer func() {
		Pool.Unregister(c.ID)
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg WSMessage
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		c.handleMessage(msg)
	}
}

func (c *Connection) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Connection) processRecipeRequest(payload RecipeUrlRequestPayload) {
	// Define progress callback that sends messages to requesting connection only
	progressCallback := func(phase, status, message string) {
		progressPayload := RecipeProgressPayload{
			Request: payload,
			Phase:   phase,
			Status:  status,
			Message: message,
		}

		progressMsg, err := NewMessage(MessageTypeRecipeProgress, progressPayload)
		if err != nil {
			log.Printf("Failed to create progress message: %v", err)
			return
		}

		// Send to requesting connection only
		Pool.BroadcastToUUIDOnlySender(c.UUID, c.ID, progressMsg)
	}

	// Get recipe using the recipe service with progress updates
	recipe, err := recipeService.GetRecipeByURL(payload.URL, progressCallback)
	if err != nil {
		log.Printf("Failed to get recipe for URL %s from connection %s: %v", payload.URL, c.ID, err)
		// Create error response
		responsePayload := RecipeAdditionsPayload{
			Status:  "ERROR_SERVICE_UNAVAILABLE",
			Request: payload,
			Recipe:  nil,
		}

		responseMsg, err := NewMessage(MessageTypeRecipeAdditions, responsePayload)
		if err != nil {
			log.Printf("Failed to create RECIPE_ADDITIONS message: %v", err)
		} else {
			Pool.BroadcastToUUID(c.UUID, responseMsg)
		}
		return
	}

	// Create successful response
	responsePayload := RecipeAdditionsPayload{
		Status:  "success",
		Request: payload,
		Recipe:  recipe,
	}

	responseMsg, err := NewMessage(MessageTypeRecipeAdditions, responsePayload)
	if err != nil {
		log.Printf("Failed to create RECIPE_ADDITIONS message: %v", err)
		return
	}

	// Broadcast to all connections in the same session (including sender)
	Pool.BroadcastToUUID(c.UUID, responseMsg)
	log.Printf("Broadcasted RECIPE_ADDITIONS to %s", c.UUID)
}

func (c *Connection) handleMessage(msg WSMessage) {
	switch msg.Type {
	case MessageTypePing:
		c.LastPing = time.Now()
		log.Printf("Received PING from connection %s", c.ID)
	case MessageTypeUserIdentify:
		var payload UserIdentifyPayload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			log.Printf("Failed to parse USER_IDENTIFY payload from connection %s: %v", c.ID, err)
			return
		}
		c.UserID = payload.UserID
		c.UserName = payload.UserName
		c.Status = "Active"
		log.Printf("User identified: %s (ID: %s) on connection %s (uuid: %s)", c.UserName, c.UserID, c.ID, c.UUID)

		joinPayload := UserJoinedPayload{
			UserID:    c.UserID,
			UserName:  c.UserName,
			SessionID: c.UUID,
		}
		joinMsg, err := NewMessage(MessageTypeUserJoined, joinPayload)
		if err != nil {
			log.Printf("Failed to create USER_JOINED message: %v", err)
		} else {
			Pool.BroadcastToUUIDExceptSender(c.UUID, c.ID, joinMsg)
			log.Printf("Broadcast USER_JOINED for user %s to session %s", c.UserName, c.UUID)
		}
	case MessageTypeChatMessage:
		if c.Status != "Active" {
			log.Printf("Rejected CHAT_MESSAGE from unidentified connection %s", c.ID)
			return
		}
		log.Printf("Received CHAT_MESSAGE from connection %s (uuid: %s)", c.ID, c.UUID)
		Pool.BroadcastToUUIDExceptSender(c.UUID, c.ID, msg)
	case MessageTypeRecipeUrlRequest:
		if c.Status != "Active" {
			log.Printf("Rejected RECIPE_URL_REQUEST from unidentified connection %s", c.ID)
			return
		}

		var payload RecipeUrlRequestPayload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			log.Printf("Failed to parse RECIPE_URL_REQUEST payload from connection %s: %v", c.ID, err)
			return
		}

		// Validate that the sender info matches the connection
		if payload.SenderID != c.UserID {
			log.Printf("Sender ID mismatch in RECIPE_URL_REQUEST from connection %s", c.ID)
			return
		}

		log.Printf("Received RECIPE_URL_REQUEST from %s (session: %s): %s", c.UserName, c.UUID, payload.URL)

		// Process recipe in a separate goroutine to avoid blocking ReadPump
		// This ensures the connection can continue processing pongs and other messages
		go c.processRecipeRequest(payload)
	default:
		log.Printf("Unknown message type from connection %s: %s", c.ID, msg.Type)
	}
}
