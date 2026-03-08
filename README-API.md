# EcoTracker Pro - API Documentation

**Base URL:** `http://localhost:3001/api`

All responses follow the format:
```json
// Success
{ "data": <result> }

// Error
{ "error": "Error message string" }
```

---

## Table of Contents

- [Health Check](#health-check)
- [Users](#users)
- [Activities](#activities)
- [Emissions](#emissions)
- [Goals](#goals)
- [Reports](#reports)
- [Emission Factors Reference](#emission-factors-reference)

---

## Health Check

### `GET /api/health`

Returns server status.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T12:00:00.000Z"
}
```

---

## Users

### `GET /api/users`

List all users, ordered by creation date.

**Response `200`**
```json
{
  "data": [
    {
      "id": "default-user-001",
      "name": "Demo User",
      "email": "demo@ecotracker.local",
      "avatar_color": "#22c55e",
      "units": "metric",
      "grid_region": "global_avg",
      "created_at": "2026-02-28 10:00:00",
      "updated_at": "2026-02-28 10:00:00"
    }
  ]
}
```

---

### `GET /api/users/:userId`

Get a single user by ID.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Response `200`**
```json
{
  "data": {
    "id": "default-user-001",
    "name": "Demo User",
    "email": "demo@ecotracker.local",
    "avatar_color": "#22c55e",
    "units": "metric",
    "grid_region": "global_avg",
    "created_at": "2026-02-28 10:00:00",
    "updated_at": "2026-02-28 10:00:00"
  }
}
```

**Response `404`**
```json
{ "error": "User not found" }
```

---

### `POST /api/users`

Create a new user. An avatar color is randomly assigned.

**Request Body**

| Field   | Type   | Required | Description              |
|---------|--------|----------|--------------------------|
| `name`  | string | Yes      | Display name             |
| `email` | string | Yes      | Must be unique across users |

**Example Request**
```json
{
  "name": "Sarah",
  "email": "sarah@family.local"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "name": "Sarah",
    "email": "sarah@family.local",
    "avatar_color": "#3b82f6",
    "units": "metric",
    "grid_region": "global_avg",
    "created_at": "2026-02-28 12:00:00",
    "updated_at": "2026-02-28 12:00:00"
  }
}
```

**Response `400`**
```json
{ "error": "Name is required" }
```

**Response `409`**
```json
{ "error": "A user with this email already exists" }
```

---

### `PUT /api/users/:userId`

Update user profile. All body fields are optional; only provided fields are updated.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Request Body**

| Field         | Type   | Required | Description                                          |
|---------------|--------|----------|------------------------------------------------------|
| `name`        | string | No       | Updated display name                                 |
| `email`       | string | No       | Updated email (must be unique)                       |
| `avatarColor` | string | No       | Hex color string, e.g., `"#ef4444"`                  |
| `units`       | string | No       | `"metric"` or `"imperial"`                           |
| `gridRegion`  | string | No       | `"global_avg"`, `"us"`, `"eu"`, `"uk"`, or `"au"`   |

**Example Request**
```json
{
  "name": "Sarah Green",
  "avatarColor": "#ec4899",
  "units": "imperial"
}
```

**Response `200`** - Returns the full updated user object (same shape as GET).

**Response `404`**
```json
{ "error": "User not found" }
```

**Response `409`**
```json
{ "error": "A user with this email already exists" }
```

---

### `DELETE /api/users/:userId`

Delete a user and **all associated data** (activities, emissions, goals) via CASCADE.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Response `200`**
```json
{ "data": { "message": "User and all associated data deleted" } }
```

**Response `404`**
```json
{ "error": "User not found" }
```

---

## Activities

### `GET /api/activities/:userId`

List activities for a user with optional filters.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter   | Type   | Default | Description                                                      |
|-------------|--------|---------|------------------------------------------------------------------|
| `category`  | string | -       | Filter by category: `transport`, `energy`, `food`, `shopping`, `waste` |
| `startDate` | string | -       | Filter activities on or after this date (`YYYY-MM-DD`)           |
| `endDate`   | string | -       | Filter activities on or before this date (`YYYY-MM-DD`)          |
| `limit`     | number | `50`    | Max number of results                                            |
| `offset`    | number | `0`     | Pagination offset                                                |

**Example Request**
```
GET /api/activities/default-user-001?category=transport&limit=10
```

**Response `200`**
```json
{
  "data": [
    {
      "id": "abc-123-...",
      "user_id": "default-user-001",
      "category": "transport",
      "type": "car_petrol",
      "description": "Commute to work",
      "value": 25,
      "unit": "km",
      "date": "2026-02-27",
      "created_at": "2026-02-27 08:00:00"
    }
  ]
}
```

---

### `POST /api/activities`

Create a new activity. **Automatically calculates and stores the CO2 emission.**

**Request Body**

| Field         | Type   | Required | Description                                                    |
|---------------|--------|----------|----------------------------------------------------------------|
| `userId`      | string | Yes      | User UUID                                                      |
| `category`    | string | Yes      | `transport`, `energy`, `food`, `shopping`, or `waste`          |
| `type`        | string | Yes      | Activity type (see [Emission Factors](#emission-factors-reference)) |
| `value`       | number | Yes      | Numeric amount (e.g., km driven, kWh used)                     |
| `unit`        | string | Yes      | Unit of measure (e.g., `km`, `kWh`, `kg`, `meal`, `item`)     |
| `date`        | string | Yes      | Activity date (`YYYY-MM-DD`)                                   |
| `description` | string | No       | Optional free-text description                                 |

**Example Request**
```json
{
  "userId": "default-user-001",
  "category": "transport",
  "type": "car_petrol",
  "value": 50,
  "unit": "km",
  "date": "2026-02-28",
  "description": "Road trip"
}
```

**Response `201`**
```json
{
  "data": {
    "activity": {
      "id": "act-uuid-...",
      "userId": "default-user-001",
      "category": "transport",
      "type": "car_petrol",
      "description": "Road trip",
      "value": 50,
      "unit": "km",
      "date": "2026-02-28"
    },
    "emission": {
      "id": "emi-uuid-...",
      "activityId": "act-uuid-...",
      "co2Kg": 10.5,
      "category": "transport",
      "date": "2026-02-28"
    }
  }
}
```

> **Note:** `co2Kg` is calculated as `value * emission_factor`. For `car_petrol`, that's `50 * 0.21 = 10.5 kg CO2`.

**Response `400`**
```json
{ "error": "Missing required fields" }
```
```json
{ "error": "Unknown type 'invalid' for category 'transport'" }
```

---

### `PUT /api/activities/:activityId`

Update an existing activity. Recalculates the associated emission automatically.

**Path Parameters**

| Parameter    | Type   | Description   |
|--------------|--------|---------------|
| `activityId` | string | Activity UUID |

**Request Body** - All fields optional; only provided fields are updated.

| Field         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `category`    | string | Updated category               |
| `type`        | string | Updated type                   |
| `value`       | number | Updated numeric value          |
| `unit`        | string | Updated unit                   |
| `date`        | string | Updated date (`YYYY-MM-DD`)    |
| `description` | string | Updated description            |

**Example Request**
```json
{
  "value": 75,
  "description": "Longer road trip"
}
```

**Response `200`**
```json
{ "data": { "message": "Activity updated", "co2Kg": 15.75 } }
```

**Response `404`**
```json
{ "error": "Activity not found" }
```

---

### `DELETE /api/activities/:activityId`

Delete an activity and its associated emission record (CASCADE).

**Path Parameters**

| Parameter    | Type   | Description   |
|--------------|--------|---------------|
| `activityId` | string | Activity UUID |

**Response `200`**
```json
{ "data": { "message": "Activity deleted" } }
```

**Response `404`**
```json
{ "error": "Activity not found" }
```

---

## Emissions

### `GET /api/emissions/summary/:userId`

Get emission totals grouped by time period and category.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter   | Type   | Default     | Description                                     |
|-------------|--------|-------------|-------------------------------------------------|
| `period`    | string | `"monthly"` | Grouping: `daily`, `weekly`, `monthly`, `yearly` |
| `startDate` | string | -           | Filter from date (`YYYY-MM-DD`)                 |
| `endDate`   | string | -           | Filter to date (`YYYY-MM-DD`)                   |

**Example Request**
```
GET /api/emissions/summary/default-user-001?period=weekly
```

**Response `200`**
```json
{
  "data": [
    {
      "period": "2026-W09",
      "category": "transport",
      "total_co2_kg": 12.5,
      "activity_count": 3
    },
    {
      "period": "2026-W09",
      "category": "energy",
      "total_co2_kg": 8.796,
      "activity_count": 2
    }
  ]
}
```

---

### `GET /api/emissions/by-category/:userId`

Get total emissions grouped by category with averages.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter   | Type   | Description                     |
|-------------|--------|---------------------------------|
| `startDate` | string | Filter from date (`YYYY-MM-DD`) |
| `endDate`   | string | Filter to date (`YYYY-MM-DD`)   |

**Response `200`**
```json
{
  "data": [
    {
      "category": "transport",
      "total_co2_kg": 142.73,
      "activity_count": 10,
      "avg_co2_kg": 14.273
    },
    {
      "category": "energy",
      "total_co2_kg": 39.03,
      "activity_count": 8,
      "avg_co2_kg": 4.879
    }
  ]
}
```

---

### `GET /api/emissions/trend/:userId`

Get daily emission totals for the last N days (for trend charts).

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter | Type   | Default | Description                |
|-----------|--------|---------|----------------------------|
| `days`    | number | `30`    | How many days to look back |

**Example Request**
```
GET /api/emissions/trend/default-user-001?days=7
```

**Response `200`**
```json
{
  "data": [
    { "date": "2026-02-22", "total_co2_kg": 5.25, "activity_count": 2 },
    { "date": "2026-02-23", "total_co2_kg": 3.1, "activity_count": 1 },
    { "date": "2026-02-27", "total_co2_kg": 11.05, "activity_count": 3 }
  ]
}
```

> **Note:** Only dates with emissions are returned. Days with no activity are omitted.

---

### `GET /api/emissions/stats/:userId`

Get aggregate statistics for a user across all time.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Response `200`**
```json
{
  "data": {
    "total_co2_kg": 203.45,
    "avg_per_activity": 5.81,
    "total_activities": 35,
    "weekly_co2_kg": 24.6,
    "monthly_co2_kg": 203.45
  }
}
```

| Field              | Description                                  |
|--------------------|----------------------------------------------|
| `total_co2_kg`     | Sum of all emissions ever                    |
| `avg_per_activity` | Average CO2 per activity entry               |
| `total_activities` | Total number of emission records             |
| `weekly_co2_kg`    | Emissions from the last 7 days               |
| `monthly_co2_kg`   | Emissions from the last 30 days              |

---

## Goals

### `GET /api/goals/:userId`

List all goals for a user. Each goal includes **live progress** calculated from actual emissions in the goal's date range.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter | Type   | Description                                                    |
|-----------|--------|----------------------------------------------------------------|
| `status`  | string | Filter by status: `active`, `completed`, `failed`, `cancelled` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "goal-uuid-...",
      "user_id": "default-user-001",
      "title": "Monthly target: 150 kg CO2",
      "description": "Stay under 150 kg CO2 for the month",
      "target_co2_kg": 150,
      "period": "monthly",
      "start_date": "2026-02-01",
      "end_date": "2026-02-28",
      "status": "active",
      "created_at": "2026-02-01 10:00:00",
      "current_co2_kg": 87.5,
      "progress_percentage": 58,
      "remaining_kg": 62.5
    }
  ]
}
```

| Computed Field          | Description                                       |
|-------------------------|---------------------------------------------------|
| `current_co2_kg`        | Actual emissions in the goal's date range         |
| `progress_percentage`   | `(current / target) * 100`, rounded to integer    |
| `remaining_kg`          | `max(0, target - current)`                        |

---

### `POST /api/goals`

Create a new emission reduction goal.

**Request Body**

| Field         | Type   | Required | Description                                    |
|---------------|--------|----------|------------------------------------------------|
| `userId`      | string | Yes      | User UUID                                      |
| `title`       | string | Yes      | Goal title                                     |
| `description` | string | No       | Goal description                               |
| `targetCo2Kg` | number | Yes      | Maximum CO2 budget in kg                       |
| `period`      | string | Yes      | `weekly`, `monthly`, or `yearly`               |
| `startDate`   | string | Yes      | Start date (`YYYY-MM-DD`)                      |
| `endDate`     | string | Yes      | End date (`YYYY-MM-DD`)                        |

**Example Request**
```json
{
  "userId": "default-user-001",
  "title": "Low-carbon week",
  "description": "Try to stay under 30 kg this week",
  "targetCo2Kg": 30,
  "period": "weekly",
  "startDate": "2026-02-23",
  "endDate": "2026-03-01"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "goal-uuid-...",
    "userId": "default-user-001",
    "title": "Low-carbon week",
    "description": "Try to stay under 30 kg this week",
    "targetCo2Kg": 30,
    "period": "weekly",
    "startDate": "2026-02-23",
    "endDate": "2026-03-01",
    "status": "active"
  }
}
```

**Response `400`**
```json
{ "error": "Missing required fields" }
```

---

### `PUT /api/goals/:goalId`

Update a goal's properties. All body fields are optional.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `goalId`  | string | Goal UUID   |

**Request Body**

| Field         | Type   | Description                                                |
|---------------|--------|------------------------------------------------------------|
| `title`       | string | Updated title                                              |
| `description` | string | Updated description                                        |
| `targetCo2Kg` | number | Updated CO2 target                                         |
| `status`      | string | `active`, `completed`, `failed`, or `cancelled`            |

**Example Request**
```json
{
  "status": "completed"
}
```

**Response `200`**
```json
{ "data": { "message": "Goal updated" } }
```

**Response `404`**
```json
{ "error": "Goal not found" }
```

---

### `DELETE /api/goals/:goalId`

Delete a goal permanently.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `goalId`  | string | Goal UUID   |

**Response `200`**
```json
{ "data": { "message": "Goal deleted" } }
```

**Response `404`**
```json
{ "error": "Goal not found" }
```

---

## Reports

### `GET /api/reports/weekly/:userId`

Get a weekly emission report with daily breakdown by category.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter   | Type   | Default | Description                           |
|-------------|--------|---------|---------------------------------------|
| `weeksBack` | number | `0`     | `0` = current week, `1` = last week, etc. |

**Response `200`**
```json
{
  "data": {
    "daily": [
      { "date": "2026-02-24", "category": "transport", "daily_co2": 5.25 },
      { "date": "2026-02-24", "category": "energy", "daily_co2": 2.796 },
      { "date": "2026-02-25", "category": "food", "daily_co2": 8.1 }
    ],
    "byCategory": [
      { "category": "transport", "total_co2": 10.5, "count": 3 },
      { "category": "energy", "total_co2": 8.796, "count": 2 },
      { "category": "food", "total_co2": 8.1, "count": 1 }
    ],
    "totalCo2Kg": 27.396,
    "period": "weekly"
  }
}
```

---

### `GET /api/reports/monthly/:userId`

Get a monthly emission report with daily breakdown by category.

**Path Parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `userId`  | string | User UUID   |

**Query Parameters**

| Parameter    | Type   | Default | Description                                |
|--------------|--------|---------|--------------------------------------------|
| `monthsBack` | number | `0`     | `0` = current month, `1` = last month, etc. |

**Response `200`**
```json
{
  "data": {
    "daily": [
      { "date": "2026-02-03", "category": "transport", "daily_co2": 3.28 },
      { "date": "2026-02-05", "category": "energy", "daily_co2": 3.495 }
    ],
    "byCategory": [
      { "category": "transport", "total_co2": 142.73, "count": 10, "avg_co2": 14.273 },
      { "category": "energy", "total_co2": 39.03, "count": 8, "avg_co2": 4.879 }
    ],
    "totalCo2Kg": 203.45,
    "period": "monthly"
  }
}
```

---

### `GET /api/reports/emission-factors`

Returns the complete table of carbon emission factors used for calculations.

**Response `200`**
```json
{
  "data": {
    "transport": {
      "car_petrol":           { "factor": 0.21,  "unit": "km" },
      "car_diesel":           { "factor": 0.17,  "unit": "km" },
      "car_electric":         { "factor": 0.05,  "unit": "km" },
      "bus":                  { "factor": 0.089, "unit": "km" },
      "train":                { "factor": 0.041, "unit": "km" },
      "plane_domestic":       { "factor": 0.255, "unit": "km" },
      "plane_international":  { "factor": 0.195, "unit": "km" },
      "bicycle":              { "factor": 0,     "unit": "km" },
      "walking":              { "factor": 0,     "unit": "km" },
      "motorcycle":           { "factor": 0.113, "unit": "km" }
    },
    "energy": {
      "electricity":  { "factor": 0.233, "unit": "kWh" },
      "natural_gas":  { "factor": 2.0,   "unit": "m3" },
      "heating_oil":  { "factor": 2.54,  "unit": "liter" },
      "solar":        { "factor": 0,     "unit": "kWh" },
      "wind":         { "factor": 0,     "unit": "kWh" }
    },
    "food": {
      "beef":             { "factor": 27.0, "unit": "kg" },
      "pork":             { "factor": 12.1, "unit": "kg" },
      "chicken":          { "factor": 6.9,  "unit": "kg" },
      "fish":             { "factor": 6.1,  "unit": "kg" },
      "dairy":            { "factor": 3.2,  "unit": "kg" },
      "vegetables":       { "factor": 2.0,  "unit": "kg" },
      "fruits":           { "factor": 1.1,  "unit": "kg" },
      "grains":           { "factor": 1.4,  "unit": "kg" },
      "plant_based_meal": { "factor": 0.7,  "unit": "meal" },
      "mixed_meal":       { "factor": 2.5,  "unit": "meal" }
    },
    "shopping": {
      "clothing":    { "factor": 15.0, "unit": "item" },
      "electronics": { "factor": 50.0, "unit": "item" },
      "furniture":   { "factor": 30.0, "unit": "item" },
      "general":     { "factor": 5.0,  "unit": "item" }
    },
    "waste": {
      "general_waste": { "factor": 0.587, "unit": "kg" },
      "recycling":     { "factor": 0.021, "unit": "kg" },
      "compost":       { "factor": 0.01,  "unit": "kg" }
    }
  }
}
```

> **How calculation works:** `co2_kg = value * factor`. For example, 50 km by car_petrol = `50 * 0.21 = 10.5 kg CO2`.

---

### `GET /api/reports/data-sources`

Returns the status of configured MCP (Model Context Protocol) external data servers.

**Response `200`**
```json
{
  "data": [
    {
      "name": "weather",
      "enabled": false,
      "description": "Weather data for energy usage insights and climate-aware recommendations",
      "capabilities": ["get_current_weather", "get_forecast", "get_historical_weather"]
    },
    {
      "name": "maps",
      "enabled": false,
      "description": "Transportation and routing data for travel emission calculations",
      "capabilities": ["get_route_distance", "get_transit_options", "estimate_travel_emissions"]
    },
    {
      "name": "news",
      "enabled": false,
      "description": "Sustainability news and content for eco-tips and awareness",
      "capabilities": ["get_sustainability_news", "get_eco_tips", "get_climate_updates"]
    }
  ]
}
```

> `enabled` is `true` when the corresponding `MCP_*_API_KEY` is set in the backend `.env` file.

---

### `GET /api/reports/eco-tips`

Returns sustainability tips. Uses the MCP news server if configured, otherwise returns built-in defaults.

**Response `200`**
```json
{
  "data": [
    { "tip": "Walk or cycle for short trips instead of driving", "category": "transport" },
    { "tip": "Switch to LED bulbs to reduce energy consumption by up to 75%", "category": "energy" },
    { "tip": "Try having one meat-free day per week", "category": "food" },
    { "tip": "Unplug electronics when not in use to avoid phantom energy draw", "category": "energy" },
    { "tip": "Use reusable bags, bottles, and containers to reduce waste", "category": "waste" }
  ]
}
```

---

## Emission Factors Reference

These are the valid `category` + `type` combinations for creating activities. The `factor` is the kg CO2 emitted per unit.

### Transport (unit: km)

| Type                   | Factor (kg CO2/km) |
|------------------------|------------------:|
| `car_petrol`           |             0.210 |
| `car_diesel`           |             0.170 |
| `car_electric`         |             0.050 |
| `bus`                  |             0.089 |
| `train`                |             0.041 |
| `plane_domestic`       |             0.255 |
| `plane_international`  |             0.195 |
| `bicycle`              |             0.000 |
| `walking`              |             0.000 |
| `motorcycle`           |             0.113 |

### Energy

| Type            | Factor         | Unit  |
|-----------------|---------------:|-------|
| `electricity`   |          0.233 | kWh   |
| `natural_gas`   |          2.000 | m3    |
| `heating_oil`   |          2.540 | liter |
| `solar`         |          0.000 | kWh   |
| `wind`          |          0.000 | kWh   |

### Food

| Type               | Factor (kg CO2) | Unit |
|--------------------|----------------:|------|
| `beef`             |           27.00 | kg   |
| `pork`             |           12.10 | kg   |
| `chicken`          |            6.90 | kg   |
| `fish`             |            6.10 | kg   |
| `dairy`            |            3.20 | kg   |
| `vegetables`       |            2.00 | kg   |
| `fruits`           |            1.10 | kg   |
| `grains`           |            1.40 | kg   |
| `plant_based_meal` |            0.70 | meal |
| `mixed_meal`       |            2.50 | meal |

### Shopping (unit: item)

| Type          | Factor (kg CO2/item) |
|---------------|---------------------:|
| `clothing`    |                15.00 |
| `electronics` |                50.00 |
| `furniture`   |                30.00 |
| `general`     |                 5.00 |

### Waste (unit: kg)

| Type             | Factor (kg CO2/kg) |
|------------------|-------------------:|
| `general_waste`  |              0.587 |
| `recycling`      |              0.021 |
| `compost`        |              0.010 |

---

## Error Codes

| HTTP Status | Meaning                              |
|-------------|--------------------------------------|
| `200`       | Success                              |
| `201`       | Created successfully                 |
| `400`       | Bad request (missing/invalid fields) |
| `404`       | Resource not found                   |
| `409`       | Conflict (e.g., duplicate email)     |

---

## Quick Test with cURL

```bash
# List users
curl http://localhost:3001/api/users

# Create a user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Mom","email":"mom@family.local"}'

# Log an activity
curl -X POST http://localhost:3001/api/activities \
  -H "Content-Type: application/json" \
  -d '{"userId":"default-user-001","category":"transport","type":"car_petrol","value":25,"unit":"km","date":"2026-02-28"}'

# Get emission stats
curl http://localhost:3001/api/emissions/stats/default-user-001

# Get weekly report
curl http://localhost:3001/api/reports/weekly/default-user-001

# Create a goal
curl -X POST http://localhost:3001/api/goals \
  -H "Content-Type: application/json" \
  -d '{"userId":"default-user-001","title":"Eco week","targetCo2Kg":40,"period":"weekly","startDate":"2026-02-23","endDate":"2026-03-01"}'

# Get emission factors
curl http://localhost:3001/api/reports/emission-factors
```
