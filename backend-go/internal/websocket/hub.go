package websocket

import (
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

// Client represents a connected websocket client
type Client struct {
	ID     string
	Conn   *websocket.Conn
	Send   chan interface{}
	UserID string
	Type   string // "admin" or "user"
	Rooms  map[string]bool
	Hub    *Hub
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients
	Clients map[*Client]bool

	// Maps room to clients
	Rooms map[string]map[*Client]bool

	// Inbound messages from the clients
	Broadcast chan interface{}

	// Register requests from the clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client

	mu sync.RWMutex
}

var MainHub *Hub

// InitHub creates a new Hub
func InitHub() *Hub {
	MainHub = &Hub{
		Broadcast:  make(chan interface{}),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
		Rooms:      make(map[string]map[*Client]bool),
	}
	go MainHub.Run()
	return MainHub
}

// Run starts the hub loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Printf("🔌 Client connected: %s (Type: %s)", client.ID, client.Type)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				client.Conn.Close()
				// Remove from rooms
				for room := range client.Rooms {
					if clients, ok := h.Rooms[room]; ok {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.Rooms, room)
						}
					}
				}
			}
			h.mu.Unlock()
			log.Printf("🔌 Client disconnected: %s", client.ID)

		case message := <-h.Broadcast:
			// Default broadcast to all
			h.mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// JoinRoom adds a client to a room
func (h *Hub) JoinRoom(client *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.Rooms[room]; !ok {
		h.Rooms[room] = make(map[*Client]bool)
	}
	h.Rooms[room][client] = true
	client.Rooms[room] = true
}

// BroadcastToRoom sends a message to all clients in a room
func (h *Hub) BroadcastToRoom(room string, message interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.Rooms[room]; ok {
		for client := range clients {
			select {
			case client.Send <- message:
			default:
				// Failed to send, assume closed
				// Cleanup will happen on next channel operation or disconnect
			}
		}
	}
}

// EmitToAdmins broadcasts to all admin clients
func (h *Hub) EmitToAdmins(event string, data interface{}) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
	}
	h.BroadcastToRoom("admins", msg)
}

// EmitToUser broadcasts to a specific user
func (h *Hub) EmitToUser(userID string, event string, data interface{}) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
	}
	h.BroadcastToRoom("user:"+userID, msg)
}

// BroadcastToAll broadcasts to all connected clients
func (h *Hub) BroadcastToAll(event string, data interface{}) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
	}
	// Broadcast to all clients
	h.mu.RLock()
	for client := range h.Clients {
		client.Send <- msg
	}
	h.mu.RUnlock()
}
