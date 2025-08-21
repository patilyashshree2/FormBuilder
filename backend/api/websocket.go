package api

import (
    "log"
    "sync"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/websocket/v2"
)

type wsClient struct {
    conn   *websocket.Conn
    formID string
}

var (
    clientsMu sync.Mutex
    clients   = map[string]map[*wsClient]bool{} // formID -> set of clients
)

func AttachWebsocket(app *fiber.App) {
    app.Get("/ws/forms/:id", websocket.New(func(c *websocket.Conn) {
        formID := c.Params("id")
        client := &wsClient{conn: c, formID: formID}

        register(client)
        defer unregister(client)

        for {
            if _, _, err := c.ReadMessage(); err != nil {
                return
            }
        }
    }))
}

func register(cl *wsClient) {
    clientsMu.Lock()
    defer clientsMu.Unlock()
    if clients[cl.formID] == nil {
        clients[cl.formID] = map[*wsClient]bool{}
    }
    clients[cl.formID][cl] = true
    log.Printf("WS connected form=%s total=%d", cl.formID, len(clients[cl.formID]))
}

func unregister(cl *wsClient) {
    clientsMu.Lock()
    defer clientsMu.Unlock()
    if set, ok := clients[cl.formID]; ok {
        delete(set, cl)
    }
    _ = cl.conn.Close()
}

func BroadcastResponse(formID string, payload interface{}) {
    clientsMu.Lock()
    set := clients[formID]
    clientsMu.Unlock()
    for cl := range set {
        _ = cl.conn.WriteJSON(map[string]interface{}{
            "type": "response_created",
            "data": payload,
        })
    }
}
