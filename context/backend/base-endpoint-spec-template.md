# Base Endpoint Specification Template

**Purpose:** This document serves as a template and reference guide for creating new backend API endpoint specifications for the RESA (Restaurant Employee Scheduling Application) backend.

**Version:** 1.0
**Last Updated:** 2025-10-29

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Specification Structure](#specification-structure)
3. [Common Patterns](#common-patterns)
4. [Security Guidelines](#security-guidelines)
5. [Database Patterns](#database-patterns)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Standards](#documentation-standards)
8. [Template Sections](#template-sections)

---

## Architecture Overview

### Backend Stack

- **Language:** Go 1.23.1
- **Router:** Chi v5
- **Database:** PostgreSQL (raw SQL, no ORM)
- **Caching:** Redis (optional, enabled via `REDIS_ENABLED` env var)
- **Authentication:** JWT tokens
- **Email:** SendGrid
- **API Documentation:** Swagger (auto-generated via swaggo)

### Project Structure

```
backend/
├── cmd/
│   ├── api/              # HTTP handlers, middleware, routing
│   │   ├── main.go       # Application entry point
│   │   ├── api.go        # Route definitions
│   │   ├── employees.go  # Employee handlers
│   │   ├── roles.go      # Role handlers
│   │   ├── restaurants.go # Restaurant handlers
│   │   ├── auth.go       # Authentication handlers
│   │   └── middleware.go # Middleware functions
│   └── migrate/          # Database migrations
│       └── migrations/   # Sequential SQL migration files
├── internal/
│   ├── store/            # Data access layer (repository pattern)
│   │   ├── storage.go    # Storage interface definitions
│   │   ├── employee.go   # Employee repository
│   │   ├── role.go       # Role repository
│   │   ├── restaurant.go # Restaurant repository
│   │   ├── user.go       # User repository
│   │   └── cache/        # Redis caching implementations
│   ├── auth/             # JWT authentication logic
│   ├── mailer/           # SendGrid email integration
│   ├── db/               # Database connection setup
│   ├── env/              # Environment variable utilities
│   └── ratelimiter/      # Rate limiting implementation
└── docs/                 # Swagger documentation (auto-generated)
```

### Architecture Patterns

1. **Clean Architecture:** Separation of concerns with handlers, business logic, and data access
2. **Repository Pattern:** All database operations go through store interfaces
3. **Interface-based Design:** Storage layer defined by interfaces in `storage.go`
4. **No ORM:** Raw SQL queries with parameterized statements
5. **Context-based Timeouts:** 5-second query timeout (`store.QueryTimeoutDuration`)

---

## Specification Structure

Every endpoint specification should include these sections in order:

### 1. Title and Overview
- Clear, descriptive title
- Brief summary of the endpoint's purpose
- Primary use case

### 2. Endpoint Details
- HTTP method (GET, POST, PATCH, DELETE)
- Full URL path with parameters
- Authentication requirements
- URL parameters with types

### 3. Request Body (if applicable)
- JSON structure
- Field descriptions
- Validation rules
- Example payload

### 4. Success Response
- HTTP status code
- Response body structure
- Example JSON response
- Empty/null case handling

### 5. Error Responses
- All possible error status codes (400, 401, 404, 500)
- Scenarios that trigger each error
- Error response format
- Example error messages

### 6. Implementation Requirements
- Authorization steps
- Validation requirements
- Business logic rules
- Database operations

### 7. Handler Implementation Pattern
- File location
- Function signature
- Step-by-step implementation with code examples
- Error handling patterns

### 8. Storage Layer Changes
- Interface changes in `storage.go`
- New methods or modifications
- Complete implementation code
- Return types and error handling

### 9. Route Registration
- File and line location
- Route definition code
- Middleware requirements

### 10. Testing Checklist
- Manual testing scenarios
- Integration test requirements
- Edge cases to cover

### 11. Performance Considerations
- Database indexing requirements
- Query optimization notes
- Caching strategies (if applicable)

### 12. Security Considerations
- Authorization checks
- Input validation
- SQL injection prevention
- Information disclosure risks

### 13. Example Usage
- cURL command examples
- Expected responses
- Common error scenarios

### 14. Related Endpoints
- Links to related functionality
- Dependencies
- Inverse operations

### 15. Implementation Checklist
- Step-by-step todo list for implementation

---

## Common Patterns

### URL Structure

All API endpoints follow this pattern:

```
/v1/restaurants/{restaurantID}/<resource>/{resourceID}/<sub-resource>
```

**Examples:**
- `/v1/restaurants/{restaurantID}/employees` - List all employees
- `/v1/restaurants/{restaurantID}/employees/{employeeID}` - Get specific employee
- `/v1/restaurants/{restaurantID}/employees/{employeeID}/roles` - Employee's roles

**Conventions:**
- Use plural nouns for collections (`/employees`, `/roles`)
- Use singular for actions (`/publish`, `/activate`)
- Use kebab-case for multi-word resources (`/shift-templates`)
- Resource IDs in path, not query params

### HTTP Methods

- **GET** - Retrieve resources (read-only, no side effects)
- **POST** - Create new resources or trigger actions
- **PATCH** - Partial update of existing resources
- **DELETE** - Remove resources

**Do NOT use:**
- PUT (use PATCH instead for updates)
- Custom methods (use POST with action paths like `/publish`)

### Authentication Pattern

All protected endpoints follow this pattern:

```go
// 1. Parse URL parameters
restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
if err != nil {
    app.badRequestResponse(w, r, err)
    return
}

// 2. Get authenticated user from context
user := getUserFromContext(r)

// 3. Verify restaurant ownership
restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
if err != nil {
    switch {
    case errors.Is(err, store.ErrNotFound):
        app.notFoundResponse(w, r, err)
    default:
        app.internalServerError(w, r, err)
    }
    return
}

// 4. Check ownership (return 404, not 401, to prevent info disclosure)
if restaurant.UserID != user.ID {
    app.notFoundResponse(w, r, errors.New("restaurant not found"))
    return
}
```

**Key Points:**
- Always verify restaurant ownership first
- Return `404 Not Found` for non-owners (not `401 Unauthorized`)
- Prevents information disclosure about restaurant existence
- Extract user from context using `getUserFromContext(r)`

### Error Response Helpers

Use these standard helper functions:

```go
app.badRequestResponse(w, r, err)        // 400 - Invalid input
app.unauthorizedErrorResponse(w, r, err) // 401 - Not authenticated/authorized
app.notFoundResponse(w, r, err)          // 404 - Resource not found
app.internalServerError(w, r, err)       // 500 - Server error
```

### JSON Response Pattern

```go
// Success response
if err := app.jsonResponse(w, http.StatusOK, data); err != nil {
    app.internalServerError(w, r, err)
}

// No content response
w.WriteHeader(http.StatusNoContent)

// Created response
if err := app.jsonResponse(w, http.StatusCreated, newResource); err != nil {
    app.internalServerError(w, r, err)
}
```

### Request Body Parsing

```go
// 1. Define payload struct
type CreateEmployeePayload struct {
    FullName string `json:"full_name" validate:"required,max=255"`
    Email    string `json:"email" validate:"required,email,max=255"`
}

// 2. Parse JSON
var payload CreateEmployeePayload
if err := readJSON(w, r, &payload); err != nil {
    app.badRequestResponse(w, r, err)
    return
}

// 3. Validate
if err := Validate.Struct(payload); err != nil {
    app.badRequestResponse(w, r, err)
    return
}
```

---

## Security Guidelines

### 1. Authentication

- All endpoints under `/v1/restaurants` require JWT authentication
- Use `app.AuthTokenMiddleware` in route definitions
- Extract user from context: `user := getUserFromContext(r)`

### 2. Authorization

- Always verify restaurant ownership before any operation
- Return `404` (not `401`) for non-owners to prevent information disclosure
- Verify sub-resources belong to parent resources (e.g., employee belongs to restaurant)

### 3. Input Validation

- Parse and validate all URL parameters
- Use struct validation tags: `validate:"required,max=255"`
- Validate integer IDs are positive
- Validate email formats
- Sanitize all user input

### 4. SQL Injection Prevention

- **ALWAYS** use parameterized queries
- **NEVER** use string concatenation for SQL
- Use `$1, $2, $3` placeholders
- Example:
  ```go
  // CORRECT
  query := `SELECT * FROM employees WHERE id = $1 AND restaurant_id = $2`
  err := db.QueryRowContext(ctx, query, employeeID, restaurantID)

  // WRONG - DO NOT DO THIS
  query := fmt.Sprintf("SELECT * FROM employees WHERE id = %d", employeeID)
  ```

### 5. Context Timeouts

- Always use context with timeout for database operations
- Standard timeout: `store.QueryTimeoutDuration` (5 seconds)
- Pattern:
  ```go
  ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
  defer cancel()
  ```

### 6. Error Messages

- Generic messages for authorization failures
- Don't reveal existence of resources to unauthorized users
- Don't expose internal implementation details
- Don't include stack traces in production

---

## Database Patterns

### Query Patterns

#### Single Row Query

```go
func (s *Store) GetByID(ctx context.Context, id int64) (*Resource, error) {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `
        SELECT id, field1, field2, created_at, updated_at
        FROM table_name
        WHERE id = $1`

    var resource Resource
    err := s.db.QueryRowContext(ctx, query, id).Scan(
        &resource.ID,
        &resource.Field1,
        &resource.Field2,
        &resource.CreatedAt,
        &resource.UpdatedAt,
    )

    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, err
    }

    return &resource, nil
}
```

#### Multiple Row Query

```go
func (s *Store) List(ctx context.Context, parentID int64) ([]*Resource, error) {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `
        SELECT id, field1, field2, created_at, updated_at
        FROM table_name
        WHERE parent_id = $1
        ORDER BY field1 ASC`

    rows, err := s.db.QueryContext(ctx, query, parentID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var resources []*Resource
    for rows.Next() {
        var resource Resource
        err := rows.Scan(
            &resource.ID,
            &resource.Field1,
            &resource.Field2,
            &resource.CreatedAt,
            &resource.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        resources = append(resources, &resource)
    }

    if err = rows.Err(); err != nil {
        return nil, err
    }

    return resources, nil
}
```

#### Insert with RETURNING

```go
func (s *Store) Create(ctx context.Context, resource *Resource) error {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `
        INSERT INTO table_name (field1, field2, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, created_at, updated_at`

    err := s.db.QueryRowContext(
        ctx,
        query,
        resource.Field1,
        resource.Field2,
    ).Scan(&resource.ID, &resource.CreatedAt, &resource.UpdatedAt)

    if err != nil {
        return err
    }

    return nil
}
```

#### Update with RETURNING

```go
func (s *Store) Update(ctx context.Context, resource *Resource) error {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `
        UPDATE table_name
        SET field1 = $1, field2 = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING updated_at`

    err := s.db.QueryRowContext(
        ctx,
        query,
        resource.Field1,
        resource.Field2,
        resource.ID,
    ).Scan(&resource.UpdatedAt)

    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return ErrNotFound
        }
        return err
    }

    return nil
}
```

#### Delete with Validation

```go
func (s *Store) Delete(ctx context.Context, id int64) error {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `DELETE FROM table_name WHERE id = $1`

    result, err := s.db.ExecContext(ctx, query, id)
    if err != nil {
        return err
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }

    if rowsAffected == 0 {
        return ErrNotFound
    }

    return nil
}
```

#### JOIN Query (Many-to-Many)

```go
func (s *Store) GetRelated(ctx context.Context, resourceID, parentID int64) ([]*Related, error) {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `
        SELECT r.id, r.field1, r.field2, r.created_at, r.updated_at
        FROM related r
        INNER JOIN junction_table jt ON r.id = jt.related_id
        WHERE jt.resource_id = $1
          AND r.parent_id = $2
        ORDER BY r.field1 ASC`

    rows, err := s.db.QueryContext(ctx, query, resourceID, parentID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var items []*Related
    for rows.Next() {
        var item Related
        err := rows.Scan(
            &item.ID,
            &item.Field1,
            &item.Field2,
            &item.CreatedAt,
            &item.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        items = append(items, &item)
    }

    if err = rows.Err(); err != nil {
        return nil, err
    }

    return items, nil
}
```

### Transaction Pattern

```go
func (s *Store) ComplexOperation(ctx context.Context, data *Data) error {
    return withTx(s.db, ctx, func(tx *sql.Tx) error {
        // Multiple operations within transaction

        // Operation 1
        _, err := tx.ExecContext(ctx, query1, params...)
        if err != nil {
            return err // Transaction will rollback
        }

        // Operation 2
        _, err = tx.ExecContext(ctx, query2, params...)
        if err != nil {
            return err // Transaction will rollback
        }

        // All operations succeeded, commit will happen automatically
        return nil
    })
}
```

---

## Testing Requirements

### Manual Testing Checklist

Every endpoint should be tested for:

1. **Happy Path**
   - [ ] Valid input produces expected output
   - [ ] Correct status code returned
   - [ ] Response format matches spec

2. **Authentication**
   - [ ] Endpoint requires valid JWT token
   - [ ] Returns 401 without authentication
   - [ ] Returns 401 with invalid/expired token

3. **Authorization**
   - [ ] Restaurant owner can access
   - [ ] Non-owner receives 404 (not 401)
   - [ ] Cross-restaurant access prevented

4. **Validation**
   - [ ] Invalid input returns 400
   - [ ] Missing required fields returns 400
   - [ ] Invalid data types return 400
   - [ ] Field length limits enforced

5. **Not Found Cases**
   - [ ] Non-existent restaurant returns 404
   - [ ] Non-existent resource returns 404
   - [ ] Sub-resource in wrong parent returns 404

6. **Edge Cases**
   - [ ] Empty collections return `[]` not null
   - [ ] Negative IDs handled appropriately
   - [ ] Very long strings truncated/rejected
   - [ ] Special characters handled correctly

7. **Performance**
   - [ ] Query completes within timeout
   - [ ] Large result sets paginated if needed
   - [ ] Indexes properly utilized

### Integration Test Template

```go
func TestEndpointName(t *testing.T) {
    t.Run("successfully performs operation", func(t *testing.T) {
        // Setup
        // Execute
        // Assert
    })

    t.Run("returns 401 for unauthenticated request", func(t *testing.T) {
        // Test
    })

    t.Run("returns 404 for wrong owner", func(t *testing.T) {
        // Test
    })

    t.Run("returns 404 for non-existent resource", func(t *testing.T) {
        // Test
    })

    t.Run("returns 400 for invalid input", func(t *testing.T) {
        // Test
    })
}
```

---

## Documentation Standards

### Swagger Comments

Every handler must have Swagger documentation:

```go
// HandlerName godoc
//
//	@Summary		Brief description of endpoint
//	@Description	Detailed description of what this endpoint does
//	@Tags			resource-name
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int						true	"Restaurant ID"
//	@Param			id				path		int						true	"Resource ID"
//	@Param			payload			body		RequestPayload			true	"Request body"
//	@Success		200				{object}	ResponseType
//	@Success		201				{object}	ResponseType
//	@Success		204				{string}	string
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/resource/{id} [get]
func (app *application) handlerName(w http.ResponseWriter, r *http.Request) {
    // Implementation
}
```

### Generating Documentation

After adding Swagger comments:

```bash
cd /Users/baecal000/programming/RESA/backend
make gen-docs
```

This updates:
- `docs/docs.go`
- `docs/swagger.json`
- `docs/swagger.yaml`

---

## Template Sections

### Minimal Endpoint Spec Template

Use this as a starting point for any new endpoint specification:

```markdown
# [Endpoint Name] Specification

## Overview

[Brief description of what this endpoint does and why it's needed]

---

## Endpoint Details

**Endpoint:** `[METHOD] /restaurants/{restaurantID}/[resource]/[{resourceID}]/[sub-resource]`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `[other params]` (type): Description

---

## Request Body (if POST/PATCH)

```json
{
  "field1": "value",
  "field2": 123
}
```

**Fields:**
- `field1` (string, required): Description
- `field2` (integer, optional): Description

---

## Success Response

**Status Code:** `[200|201|204]`

**Response Body:**
```json
{
  "id": 1,
  "field1": "value",
  "created_at": "2025-10-29T10:00:00Z"
}
```

**Empty Case:** [Describe what happens when no results]

---

## Error Responses

### 400 Bad Request
**Scenarios:** [List scenarios]

### 401 Unauthorized
**Scenarios:** User is not authenticated or not restaurant owner

### 404 Not Found
**Scenarios:** [List scenarios]

### 500 Internal Server Error
**Scenarios:** Database or server error

---

## Implementation Requirements

### 1. Authorization
[Steps to verify user access]

### 2. Validation
[Input validation requirements]

### 3. Database Query
[SQL query and explanation]

### 4. Response Handling
[How to format and return response]

---

## Handler Implementation Pattern

### Location
**File:** `backend/cmd/api/[resource].go`

**Function Name:** `[action][Resource]Handler`

### Implementation Steps

[Numbered list with code examples]

---

## Storage Layer Changes

### Location
**File:** `backend/internal/store/[resource].go`

### New Method

[Interface definition and implementation]

---

## Route Registration

### Location
**File:** `backend/cmd/api/api.go`

### Route Definition

[Code showing where to add the route]

---

## Testing Checklist

### Manual Testing

1. **Happy Path**
   - [ ] Test case description

2. **Authorization**
   - [ ] Test case description

[More test scenarios]

---

## Performance Considerations

[Indexing, caching, optimization notes]

---

## Security Considerations

[Authorization, validation, security notes]

---

## Example cURL Request

```bash
curl -X [METHOD] "http://localhost:8080/v1/..." \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

**Expected Response:**
[Show example response]

---

## Related Endpoints

- [List related endpoints and their relationship]

---

## Implementation Checklist

- [ ] Add method to interface in `storage.go`
- [ ] Implement method in `[resource].go`
- [ ] Create handler in `[resource].go`
- [ ] Add Swagger comments
- [ ] Register route in `api.go`
- [ ] Run `make gen-docs`
- [ ] Test manually
- [ ] Add integration tests
```

---

## Best Practices Summary

1. **Always** verify restaurant ownership before any operation
2. **Always** use parameterized queries (never string concatenation)
3. **Always** use context with timeout for database operations
4. **Always** return `404` (not `401`) for authorization failures
5. **Always** validate input before processing
6. **Always** handle `sql.ErrNoRows` as `ErrNotFound`
7. **Always** close database rows with `defer rows.Close()`
8. **Always** check `rows.Err()` after iteration
9. **Always** add Swagger documentation comments
10. **Always** sort results consistently (usually by name or created_at)

---

## Common Mistakes to Avoid

1. ❌ Don't use string concatenation for SQL queries
2. ❌ Don't forget to close database rows
3. ❌ Don't return `401` when user lacks permissions (use `404`)
4. ❌ Don't expose internal error details to clients
5. ❌ Don't skip input validation
6. ❌ Don't forget context timeouts
7. ❌ Don't return `null` for empty collections (return `[]`)
8. ❌ Don't use PUT method (use PATCH instead)
9. ❌ Don't forget to check `rows.Err()` after iteration
10. ❌ Don't forget to verify sub-resources belong to parent

---

## Quick Reference Checklist

When creating a new endpoint specification, ensure you cover:

- [ ] Clear purpose and use case
- [ ] Complete URL path with parameters
- [ ] Request body structure (if applicable)
- [ ] Success response with examples
- [ ] All error responses (400, 401, 404, 500)
- [ ] Authorization pattern
- [ ] Database query with explanation
- [ ] Handler implementation steps
- [ ] Storage layer changes
- [ ] Route registration location
- [ ] Testing scenarios
- [ ] Security considerations
- [ ] Performance notes
- [ ] Example cURL command
- [ ] Related endpoints
- [ ] Implementation checklist

---

## Example Implementations

For complete working examples, reference these existing endpoints:

1. **GET endpoint:** `getEmployeeRolesHandler` in `backend/cmd/api/employees.go`
2. **POST endpoint:** `createEmployeeHandler` in `backend/cmd/api/employees.go`
3. **PATCH endpoint:** `updateEmployeeHandler` in `backend/cmd/api/employees.go`
4. **DELETE endpoint:** `deleteEmployeeHandler` in `backend/cmd/api/employees.go`

Specifications:
1. `context/backend/get-employee-roles-spec.md`
2. `context/backend/get-role-employees-spec.md`

---

## Version History

- **v1.0** (2025-10-29): Initial template created based on existing patterns

---

## Support

For questions or clarifications about endpoint implementation:
1. Review existing implementations in the codebase
2. Check existing specification documents in `context/backend/`
3. Follow patterns from similar endpoints
4. Ensure consistency with architectural principles
