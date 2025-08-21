package api

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

type Form struct {
    ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Title     string             `bson:"title" json:"title"`
    Status    string             `bson:"status" json:"status"` // "draft" or "published"
    Fields    []Field            `bson:"fields" json:"fields"`
    CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
    UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
    OwnerID   string             `bson:"ownerId,omitempty" json:"ownerId,omitempty"`
}

type Field struct {
    ID       string   `bson:"id" json:"id"`
    Label    string   `bson:"label" json:"label"`
    Type     string   `bson:"type" json:"type"` // text, multiple_choice, checkboxes, rating
    Required bool     `bson:"required" json:"required"`
    Options  []string `bson:"options,omitempty" json:"options,omitempty"`
    Min      int      `bson:"min,omitempty" json:"min,omitempty"`
    Max      int      `bson:"max,omitempty" json:"max,omitempty"`
    ShowIf   *ShowIf  `bson:"showIf,omitempty" json:"showIf,omitempty"`
    IsPII    bool     `bson:"isPII" json:"isPII"`
}

type ShowIf struct {
    FieldID string      `bson:"fieldId" json:"fieldId"`
    Equals  interface{} `bson:"equals" json:"equals"`
}

type Response struct {
    ID        primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
    FormID    primitive.ObjectID     `bson:"formId" json:"formId"`
    Answers   map[string]interface{} `bson:"answers" json:"answers"`
    CreatedAt time.Time              `bson:"createdAt" json:"createdAt"`
}

type Analytics struct {
    Count          int                      `json:"count"`
    FieldBreakdown map[string]Distribution  `json:"fieldBreakdown"`
    AverageRating  map[string]float64       `json:"averageRating"`
}

type Distribution struct {
    Buckets map[string]int `json:"buckets"`
}
