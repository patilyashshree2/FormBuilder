package api

import (
    "github.com/gofiber/fiber/v2"
    "formbuilder/backend/config"
)

func AttachRoutes(app *fiber.App, cfg *config.Config) {
    api := app.Group("/api")

    // Auth routes
    api.Post("/auth/register", RegisterHandler(cfg))
    api.Post("/auth/login", LoginHandler(cfg))

    // Public routes (no auth required)
    api.Post("/forms/:id/responses", SubmitResponseHandler(cfg))

    // Protected routes
    protected := api.Group("", AuthMiddleware(cfg))
    protected.Get("/forms", GetAllFormsHandler(cfg))
    protected.Post("/forms", CreateFormHandler(cfg))
    protected.Get("/forms/:id", GetFormHandler(cfg))
    protected.Put("/forms/:id", UpdateFormHandler(cfg))
    protected.Get("/forms/:id/analytics", AnalyticsHandler(cfg))
    protected.Get("/forms/:id/export.csv", ExportCSVHandler(cfg))
}
