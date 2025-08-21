package api

import (
    "errors"
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/golang-jwt/jwt/v5"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "golang.org/x/crypto/bcrypt"
    "formbuilder/backend/config"
)

type User struct {
    ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Email    string             `bson:"email" json:"email"`
    Password string             `bson:"password" json:"-"`
    Name     string             `bson:"name" json:"name"`
    CreatedAt time.Time         `bson:"createdAt" json:"createdAt"`
}

type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

type RegisterRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
    Name     string `json:"name"`
}

func usersCol(cfg *config.Config) *mongo.Collection {
    return mongoClient(cfg).Database(cfg.MongoDB).Collection("users")
}

func RegisterHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        var req RegisterRequest
        if err := c.BodyParser(&req); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, err.Error())
        }

        // Check if user exists
        var existingUser User
        err := usersCol(cfg).FindOne(c.Context(), bson.M{"email": req.Email}).Decode(&existingUser)
        if err == nil {
            return fiber.NewError(fiber.StatusConflict, "User already exists")
        }

        // Hash password
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, "Failed to hash password")
        }

        user := User{
            ID:        primitive.NewObjectID(),
            Email:     req.Email,
            Password:  string(hashedPassword),
            Name:      req.Name,
            CreatedAt: time.Now(),
        }

        _, err = usersCol(cfg).InsertOne(c.Context(), user)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }

        token, err := generateJWT(user.ID.Hex(), cfg.JWTSecret)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, "Failed to generate token")
        }

        return c.JSON(fiber.Map{
            "token": token,
            "user":  user,
        })
    }
}

func LoginHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        var req LoginRequest
        if err := c.BodyParser(&req); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, err.Error())
        }

        var user User
        err := usersCol(cfg).FindOne(c.Context(), bson.M{"email": req.Email}).Decode(&user)
        if err != nil {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid credentials")
        }

        err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
        if err != nil {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid credentials")
        }

        token, err := generateJWT(user.ID.Hex(), cfg.JWTSecret)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, "Failed to generate token")
        }

        return c.JSON(fiber.Map{
            "token": token,
            "user":  user,
        })
    }
}

func generateJWT(userID, secret string) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
    })
    return token.SignedString([]byte(secret))
}

func AuthMiddleware(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return fiber.NewError(fiber.StatusUnauthorized, "Missing authorization header")
        }

        tokenString := authHeader
        if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
            tokenString = authHeader[7:]
        }

        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, errors.New("unexpected signing method")
            }
            return []byte(cfg.JWTSecret), nil
        })

        if err != nil || !token.Valid {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid token")
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid token claims")
        }

        userID, ok := claims["user_id"].(string)
        if !ok {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid user ID in token")
        }

        c.Locals("userID", userID)
        return c.Next()
    }
}
