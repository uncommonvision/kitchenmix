package websocket

import (
	"encoding/json"
	"time"

	"kitchenmix/api/internal/models"
)

const (
	MessageTypeConnectionAck    = "CONNECTION_ACK"
	MessageTypePing             = "PING"
	MessageTypeUserIdentify     = "USER_IDENTIFY"
	MessageTypeUserJoined       = "USER_JOINED"
	MessageTypeUserLeft         = "USER_LEFT"
	MessageTypeChatMessage      = "CHAT_MESSAGE"
	MessageTypeRecipeUrlRequest = "RECIPE_URL_REQUEST"
	MessageTypeRecipeAdditions  = "RECIPE_ADDITIONS"
	MessageTypeRecipeProgress   = "RECIPE_PROGRESS"
)

type WSMessage struct {
	Type      string          `json:"type"`
	Timestamp time.Time       `json:"timestamp"`
	Data      json.RawMessage `json:"data"`
}

func NewMessage(messageType string, data interface{}) (WSMessage, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return WSMessage{}, err
	}

	return WSMessage{
		Type:      messageType,
		Timestamp: time.Now(),
		Data:      jsonData,
	}, nil
}

type UserIdentifyPayload struct {
	UserID   string `json:"userId"`
	UserName string `json:"userName"`
}

type UserJoinedPayload struct {
	UserID    string `json:"userId"`
	UserName  string `json:"userName"`
	SessionID string `json:"sessionId"`
}

type UserLeftPayload struct {
	UserID    string `json:"userId"`
	UserName  string `json:"userName"`
	SessionID string `json:"sessionId"`
}

type RecipeUrlRequestPayload struct {
	SharerID   string `json:"sharerId"`
	SharerName string `json:"sharerName"`
	URL        string `json:"url"`
}

type RecipeAdditionsPayload struct {
	Status string           `json:"status"`
	List   []*models.Recipe `json:"list"`
}

type RecipeProgressPayload struct {
	Request RecipeUrlRequestPayload `json:"request"`
	Phase   string                  `json:"phase"`
	Status  string                  `json:"status"`
	Message string                  `json:"message"`
}
