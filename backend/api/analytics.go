package api

import (
    "context"
    "time"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "formbuilder/backend/config"
)

type TrendData struct {
    Date  string `json:"date"`
    Count int    `json:"count"`
}

type SkippedField struct {
    FieldID   string `json:"fieldId"`
    FieldName string `json:"fieldName"`
    SkipCount int    `json:"skipCount"`
    SkipRate  float64 `json:"skipRate"`
}

type EnhancedAnalytics struct {
    Count              int                      `json:"count"`
    FieldBreakdown     map[string]Distribution  `json:"fieldBreakdown"`
    AverageRating      map[string]float64       `json:"averageRating"`
    ResponseTrends     []TrendData              `json:"responseTrends"`
    MostCommonAnswers  map[string]string        `json:"mostCommonAnswers"`
    SkippedFields      []SkippedField           `json:"skippedFields"`
    CompletionRate     float64                  `json:"completionRate"`
}

func computeAnalytics(ctx context.Context, cfg *config.Config, formID primitive.ObjectID) (*EnhancedAnalytics, error) {
    // Get form details
    var form Form
    if err := formsCol(cfg).FindOne(ctx, bson.M{"_id": formID}).Decode(&form); err != nil {
        return nil, err
    }

    an := &EnhancedAnalytics{
        FieldBreakdown:    map[string]Distribution{},
        AverageRating:     map[string]float64{},
        MostCommonAnswers: map[string]string{},
        ResponseTrends:    []TrendData{},
        SkippedFields:     []SkippedField{},
    }

    cur, err := responsesCol(cfg).Find(ctx, bson.M{"formId": formID})
    if err != nil { return nil, err }
    defer cur.Close(ctx)

    count := 0
    sums := map[string]float64{}
    counts := map[string]int{}
    dailyCounts := map[string]int{}
    fieldCounts := map[string]int{}
    fieldSkips := map[string]int{}

    for cur.Next(ctx) {
        var r Response
        if err := cur.Decode(&r); err != nil { return nil, err }
        count++

        // Daily trends
        dateKey := r.CreatedAt.Format("2006-01-02")
        dailyCounts[dateKey]++

        // Field analysis (exclude PII fields)
        for _, field := range form.Fields {
            if field.IsPII {
                continue // Skip PII fields in analytics
            }
            
            fieldCounts[field.ID]++
            if val, exists := r.Answers[field.ID]; exists && val != nil {
                d := an.FieldBreakdown[field.ID]
                if d.Buckets == nil { d.Buckets = map[string]int{} }
                
                switch v := val.(type) {
                case string:
                    if v != "" {
                        d.Buckets[v]++
                    } else {
                        fieldSkips[field.ID]++
                    }
                case float64:
                    d.Buckets["value"]++
                    sums[field.ID] += v
                    counts[field.ID]++
                case bool:
                    if v { d.Buckets["true"]++ } else { d.Buckets["false"]++ }
                case []interface{}:
                    if len(v) > 0 {
                        for _, it := range v {
                            if s, ok := it.(string); ok { d.Buckets[s]++ }
                        }
                    } else {
                        fieldSkips[field.ID]++
                    }
                default:
                    d.Buckets["other"]++
                }
                an.FieldBreakdown[field.ID] = d
            } else {
                fieldSkips[field.ID]++
            }
        }
    }

    an.Count = count

    // Calculate averages
    for k := range sums {
        if counts[k] > 0 {
            an.AverageRating[k] = sums[k] / float64(counts[k])
        }
    }

    // Most common answers
    for fieldID, dist := range an.FieldBreakdown {
        maxCount := 0
        mostCommon := ""
        for answer, answerCount := range dist.Buckets {
            if answerCount > maxCount {
                maxCount = answerCount
                mostCommon = answer
            }
        }
        if mostCommon != "" {
            an.MostCommonAnswers[fieldID] = mostCommon
        }
    }

    // Response trends (last 7 days)
    for i := 6; i >= 0; i-- {
        date := time.Now().AddDate(0, 0, -i)
        dateKey := date.Format("2006-01-02")
        an.ResponseTrends = append(an.ResponseTrends, TrendData{
            Date:  dateKey,
            Count: dailyCounts[dateKey],
        })
    }

    // Skipped fields analysis (exclude PII fields)
    for _, field := range form.Fields {
        if field.IsPII {
            continue // Skip PII fields in analytics
        }
        
        skipCount := fieldSkips[field.ID]
        skipRate := 0.0
        if count > 0 {
            skipRate = float64(skipCount) / float64(count) * 100
        }
        an.SkippedFields = append(an.SkippedFields, SkippedField{
            FieldID:   field.ID,
            FieldName: field.Label,
            SkipCount: skipCount,
            SkipRate:  skipRate,
        })
    }

    // Completion rate
    totalFields := len(form.Fields)
    if totalFields > 0 && count > 0 {
        totalAnswered := 0
        for _, fieldCount := range fieldCounts {
            totalAnswered += fieldCount - fieldSkips[form.Fields[0].ID] // Approximate
        }
        an.CompletionRate = float64(totalAnswered) / float64(totalFields*count) * 100
    }

    return an, nil
}
