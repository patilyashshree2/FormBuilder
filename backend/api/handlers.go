package api

import (
    "bytes"
    "context"
    "encoding/csv"
    "errors"
    "fmt"
    "net/http"
    "time"

    "github.com/gofiber/fiber/v2"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "formbuilder/backend/config"
)

func formsCol(cfg *config.Config) *mongo.Collection {
    return mongoClient(cfg).Database(cfg.MongoDB).Collection("forms")
}
func responsesCol(cfg *config.Config) *mongo.Collection {
    return mongoClient(cfg).Database(cfg.MongoDB).Collection("responses")
}

var _client *mongo.Client

func mongoClient(cfg *config.Config) *mongo.Client {
    if _client != nil { return _client }
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
    if err != nil { panic(err) }
    _client = client
    return client
}

func GetAllFormsHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        userID := c.Locals("userID").(string)
        cur, err := formsCol(cfg).Find(c.Context(), bson.M{"ownerId": userID}, options.Find().SetSort(bson.M{"updatedAt": -1}))
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }
        defer cur.Close(c.Context())

        var forms []Form
        if err := cur.All(c.Context(), &forms); err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }
        return c.JSON(forms)
    }
}

func CreateFormHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        userID := c.Locals("userID").(string)
        var f Form
        if err := c.BodyParser(&f); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, err.Error())
        }
        
        // Validation
        if f.Title == "" || f.Title == "Untitled Form" {
            return fiber.NewError(fiber.StatusBadRequest, "Form title is required")
        }
        
        if len(f.Fields) == 0 {
            return fiber.NewError(fiber.StatusBadRequest, "At least one field is required")
        }
        
        hasRequiredField := false
        for _, field := range f.Fields {
            if field.Required {
                hasRequiredField = true
                break
            }
        }
        if !hasRequiredField {
            return fiber.NewError(fiber.StatusBadRequest, "At least one field must be required")
        }
        
        // Validate fields
        for _, field := range f.Fields {
            if field.Label == "" || field.Label == "Question" {
                return fiber.NewError(fiber.StatusBadRequest, "All fields must have proper labels")
            }
            
            // PII fields must be required
            if field.IsPII && !field.Required {
                return fiber.NewError(fiber.StatusBadRequest, "PII fields must be required")
            }
            
            if field.Type == "single_choice" || field.Type == "multi_select" {
                if len(field.Options) == 0 {
                    return fiber.NewError(fiber.StatusBadRequest, "Choice fields must have at least one option")
                }
                for _, option := range field.Options {
                    if option == "" {
                        return fiber.NewError(fiber.StatusBadRequest, "All options must have text")
                    }
                }
            }
        }
        
        if f.Status == "" { f.Status = "draft" }
        f.ID = primitive.NewObjectID()
        f.OwnerID = userID
        f.CreatedAt = time.Now()
        f.UpdatedAt = f.CreatedAt

        _, err := formsCol(cfg).InsertOne(c.Context(), f)
        if err != nil { return fiber.NewError(fiber.StatusInternalServerError, err.Error()) }
        return c.Status(http.StatusCreated).JSON(f)
    }
}

func GetFormHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        oid, err := primitive.ObjectIDFromHex(c.Params("id"))
        if err != nil { return fiber.NewError(fiber.StatusBadRequest, "invalid id") }
        var f Form
        err = formsCol(cfg).FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f)
        if err != nil {
            if err == mongo.ErrNoDocuments { return fiber.NewError(fiber.StatusNotFound, "not found") }
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }
        return c.JSON(f)
    }
}

func UpdateFormHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        oid, err := primitive.ObjectIDFromHex(c.Params("id"))
        if err != nil { return fiber.NewError(fiber.StatusBadRequest, "invalid id") }
        var f Form
        if err := c.BodyParser(&f); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, err.Error())
        }
        f.UpdatedAt = time.Now()
        _, err = formsCol(cfg).UpdateByID(c.Context(), oid, bson.M{"$set": f})
        if err != nil { return fiber.NewError(fiber.StatusInternalServerError, err.Error()) }
        err = formsCol(cfg).FindOne(c.Context(), bson.M{"_id": oid}).Decode(&f)
        if err != nil { return fiber.NewError(fiber.StatusInternalServerError, err.Error()) }
        return c.JSON(f)
    }
}

func SubmitResponseHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        formOID, err := primitive.ObjectIDFromHex(c.Params("id"))
        if err != nil { return fiber.NewError(fiber.StatusBadRequest, "invalid id") }

        var f Form
        if err := formsCol(cfg).FindOne(c.Context(), bson.M{"_id": formOID}).Decode(&f); err != nil {
            if err == mongo.ErrNoDocuments { return fiber.NewError(fiber.StatusNotFound, "form not found") }
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }
        if f.Status != "published" {
            return fiber.NewError(fiber.StatusBadRequest, "form not published")
        }

        var r Response
        if err := c.BodyParser(&r); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, err.Error())
        }
        if r.Answers == nil { r.Answers = map[string]interface{}{} }

        if err := validateSubmission(&f, r.Answers); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, err.Error())
        }

        r.ID = primitive.NewObjectID()
        r.FormID = formOID
        r.CreatedAt = time.Now()
        if _, err := responsesCol(cfg).InsertOne(c.Context(), r); err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }

        BroadcastResponse(formOID.Hex(), r)
        return c.Status(http.StatusCreated).JSON(r)
    }
}

func validateSubmission(f *Form, answers map[string]interface{}) error {
    for _, field := range f.Fields {
        // Conditional visibility check
        if field.ShowIf != nil {
            if val, ok := answers[field.ShowIf.FieldID]; ok {
                if val != field.ShowIf.Equals {
                    continue // hidden -> no further checks
                }
            } else {
                continue // hidden due to missing dependency
            }
        }

        // Required
        if field.Required {
            if _, ok := answers[field.ID]; !ok {
                return errors.New("missing required field: " + field.Label)
            }
        }

        if v, ok := answers[field.ID]; ok {
            switch field.Type {
            case "text":
                s, ok := v.(string)
                if !ok || len(s) == 0 {
                    return errors.New("invalid text for: " + field.Label)
                }
            case "single_choice":
                s, ok := v.(string)
                if !ok || s == "" { return errors.New("invalid choice for: " + field.Label) }
                allowed := false
                for _, opt := range field.Options {
                    if opt == s { allowed = true; break }
                }
                if !allowed { return errors.New("choice not in options for: " + field.Label) }
            case "multi_select":
                arr, ok := v.([]interface{})
                if !ok { return errors.New("invalid selections for: " + field.Label) }
                for _, raw := range arr {
                    s, ok := raw.(string)
                    if !ok { return errors.New("invalid selection value for: " + field.Label) }
                    allowed := false
                    for _, opt := range field.Options {
                        if opt == s { allowed = true; break }
                    }
                    if !allowed { return errors.New("selection value not allowed for: " + field.Label) }
                }
            case "rating":
                num, ok := v.(float64)
                if !ok { return errors.New("invalid rating for: " + field.Label) }
                min := field.Min
                max := field.Max
                if min == 0 { min = 1 }
                if max == 0 { max = 5 }
                if num < float64(min) || num > float64(max) {
                    return errors.New("rating out of range for: " + field.Label)
                }
            default:
                // allow minimal
            }
        }
    }
    return nil
}

func AnalyticsHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        oid, err := primitive.ObjectIDFromHex(c.Params("id"))
        if err != nil { return fiber.NewError(fiber.StatusBadRequest, "invalid id") }
        an, err := computeAnalytics(c.Context(), cfg, oid)
        if err != nil { return fiber.NewError(fiber.StatusInternalServerError, err.Error()) }
        return c.JSON(an)
    }
}

func ExportCSVHandler(cfg *config.Config) fiber.Handler {
    return func(c *fiber.Ctx) error {
        oid, err := primitive.ObjectIDFromHex(c.Params("id"))
        if err != nil { return fiber.NewError(fiber.StatusBadRequest, "invalid id") }

        cur, err := responsesCol(cfg).Find(c.Context(), bson.M{"formId": oid})
        if err != nil { return fiber.NewError(fiber.StatusInternalServerError, err.Error()) }
        defer cur.Close(c.Context())

        records := [][]string{{"response_id", "created_at", "field_id", "value"}}
        for cur.Next(c.Context()) {
            var r Response
            if err := cur.Decode(&r); err != nil {
                return fiber.NewError(fiber.StatusInternalServerError, err.Error())
            }
            for k, v := range r.Answers {
                records = append(records, []string{
                    r.ID.Hex(),
                    r.CreatedAt.Format(time.RFC3339),
                    k,
                    toString(v),
                })
            }
        }
        buf := &bytes.Buffer{}
        w := csv.NewWriter(buf)
        _ = w.WriteAll(records)

        c.Set("Content-Type", "text/csv")
        c.Set("Content-Disposition", "attachment; filename=responses.csv")
        return c.Send(buf.Bytes())
    }
}

func toString(v interface{}) string {
    switch t := v.(type) {
    case string:
        return t
    case float64:
        return fmt.Sprintf("%v", t)
    case bool:
        if t { return "true" }
        return "false"
    default:
        b, _ := bson.MarshalExtJSON(v, false, false)
        return string(b)
    }
}
