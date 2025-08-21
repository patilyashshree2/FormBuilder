package main

import (
    "log"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/websocket/v2"
    "formbuilder/backend/api"
    "formbuilder/backend/config"
)

func main() {
    cfg := config.Load()

    app := fiber.New()
    app.Use(cors.New(cors.Config{
        AllowOrigins: cfg.AllowOrigin,
        AllowHeaders: "Origin, Content-Type, Accept, Authorization",
        AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
    }))

    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"ok": true})
    })

    api.AttachRoutes(app, cfg)

    app.Use("/ws", func(c *fiber.Ctx) error {
        if websocket.IsWebSocketUpgrade(c) {
            return c.Next()
        }
        return fiber.ErrUpgradeRequired
    })
    api.AttachWebsocket(app)

    log.Printf("Listening on :%s", cfg.Port)
    if err := app.Listen(":" + cfg.Port); err != nil {
        log.Fatal(err)
    }
}
