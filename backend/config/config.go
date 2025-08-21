package config

import (
    "log"
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    MongoURI    string
    MongoDB     string
    Port        string
    JWTSecret   string
    AllowOrigin string
}

func Load() *Config {
    _ = godotenv.Load(".env")
    cfg := &Config{
        MongoURI:    env("MONGO_URI", "mongodb://localhost:27017"),
        MongoDB:     env("MONGO_DB", "formbuilder"),
        Port:        env("PORT", "8080"),
        JWTSecret:   env("JWT_SECRET", "changeme"),
        AllowOrigin: env("ALLOW_ORIGIN", "*"),
    }
    log.Printf("Config loaded. DB=%s Port=%s", cfg.MongoDB, cfg.Port)
    return cfg
}

func env(k, def string) string {
    if v := os.Getenv(k); v != "" {
        return v
    }
    return def
}
