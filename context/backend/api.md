# RESA API Documentation

**Base URL:** `http://localhost:8080/v1` (configurable via `API_ADDR` environment variable)

**Authentication:** Most endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Restaurant Management](#restaurant-management)
4. [Employee Management](#employee-management)
5. [Role Management](#role-management)
6. [Shift Templates](#shift-templates)
7. [Schedule Management](#schedule-management)
8. [Scheduled Shifts](#scheduled-shifts)
9. [Data Models](#data-models)
10. [Error Responses](#error-responses)

---

## Authentication

### 1. Register User (Sign Up)

Creates a new user account and sends a magic link activation email.

**Endpoint:** `POST /authentication/user`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securePassword123"
}
```

**Validation Rules:**
- `email`: Required, valid email format, max 255 characters
- `first_name`: Required, max 255 characters
- `last_name`: Required, max 255 characters
- `password`: Required, min 3 characters, max 72 characters

**Success Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "is_active": false,
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Notes:**
- User account is created but `is_active` is `false` until email is confirmed
- `token` is the magic link token sent via email (also returned in response)
- Email is sent to user with activation link: `{FRONTEND_URL}/confirm/{token}`
- If email sending fails, the user creation is rolled back (SAGA pattern)

---

### 2. Create Token (Login)

Authenticates a user with email and password, returns JWT token.

**Endpoint:** `POST /authentication/token`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
- `email`: Required, valid email format, max 255 characters
- `password`: Required, min 3 characters, max 72 characters

**Success Response (201 Created):**
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

**JWT Claims:**
- `sub`: User ID
- `exp`: Expiration timestamp (configured via `AUTH_TOKEN_EXP`)
- `iat`: Issued at timestamp
- `nbf`: Not before timestamp
- `iss`: Issuer (configured via `AUTH_TOKEN_ISS`)
- `aud`: Audience (same as issuer)

**Error Responses:**
- `401 Unauthorized`: Invalid credentials or user not found (same message to prevent user enumeration)
- `400 Bad Request`: Invalid request format

---

### 3. Refresh Token

Generates a new JWT token with extended expiration using an existing valid token.

**Endpoint:** `POST /authentication/refresh`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <existing_jwt_token>
```

**Request Body:** None

**Success Response (200 OK):**
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Token generation failed

**Notes:**
- Returns a new JWT token with the same user ID but fresh expiration time
- Original token remains valid until its expiration

---

## User Management

### 4. Activate User

Activates a user account using the magic link token sent via email.

**Endpoint:** `PUT /users/activate/{token}`

**Authentication:** None (Public)

**URL Parameters:**
- `token` (string): The activation token from the email

**Request Body:** None

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Invalid or expired token
- `500 Internal Server Error`: Database error

**Notes:**
- Sets `is_active` to `true` for the user
- Deletes the invitation token after successful activation
- Token expires based on `MAIL_EXP` environment variable (default: 24 hours)

---

## Restaurant Management

All restaurant endpoints require authentication.

### 5. Create Restaurant

Creates a new restaurant owned by the authenticated user.

**Endpoint:** `POST /restaurants`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "The Great Restaurant",
  "address": "123 Main St, City, State 12345",
  "phone": "+1-555-123-4567"
}
```

**Validation Rules:**
- `name`: Required, max 255 characters
- `address`: Required, max 500 characters
- `phone`: Optional, max 20 characters

**Success Response (201 Created):**
```json
{
  "id": 1,
  "employer_id": 10,
  "name": "The Great Restaurant",
  "address": "123 Main St, City, State 12345",
  "phone": "+1-555-123-4567",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "version": 0
}
```

**Notes:**
- `employer_id` is automatically set to the authenticated user's ID
- Restaurant is cached in Redis if caching is enabled

---

### 6. Get All Restaurants (User's)

Retrieves all restaurants owned by the authenticated user.

**Endpoint:** `GET /restaurants`

**Authentication:** Required

**Request Body:** None

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "employer_id": 10,
    "name": "The Great Restaurant",
    "address": "123 Main St, City, State 12345",
    "phone": "+1-555-123-4567",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "version": 0
  },
  {
    "id": 2,
    "employer_id": 10,
    "name": "Second Restaurant",
    "address": "456 Oak Ave, City, State 12345",
    "phone": null,
    "created_at": "2025-01-16T14:20:00Z",
    "updated_at": "2025-01-16T14:20:00Z",
    "version": 0
  }
]
```

---

### 7. Get Restaurant by ID

Retrieves a specific restaurant by ID.

**Endpoint:** `GET /restaurants/{restaurantID}`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "employer_id": 10,
  "name": "The Great Restaurant",
  "address": "123 Main St, City, State 12345",
  "phone": "+1-555-123-4567",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "version": 0
}
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `400 Bad Request`: Invalid restaurant ID format

**Notes:**
- Uses Redis cache if enabled (cache hit logged)
- Only returns restaurants owned by the authenticated user

---

### 8. Update Restaurant

Updates a restaurant's information. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Restaurant Name",
  "address": "789 New St, City, State 12345",
  "phone": "+1-555-999-8888"
}
```

**Validation Rules:**
- `name`: Optional, max 255 characters
- `address`: Optional, max 255 characters
- `phone`: Optional, max 20 characters (can be `null` to remove)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "employer_id": 10,
  "name": "Updated Restaurant Name",
  "address": "789 New St, City, State 12345",
  "phone": "+1-555-999-8888",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-17T09:15:00Z",
  "version": 1
}
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `401 Unauthorized`: User is not the restaurant owner
- `400 Bad Request`: Validation failed

**Notes:**
- Uses optimistic locking via `version` field
- Cache is updated after successful update

---

### 9. Delete Restaurant

Deletes a restaurant. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Cascading deletes all related data (employees, roles, schedules, shifts, etc.)
- Cache is cleared before database deletion

---

## Employee Management

### 10. Get All Employees

Retrieves all employees for a specific restaurant.

**Endpoint:** `GET /restaurants/{restaurantID}/employees`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "restaurant_id": 5,
    "full_name": "Alice Johnson",
    "email": "alice@example.com",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "restaurant_id": 5,
    "full_name": "Bob Smith",
    "email": "bob@example.com",
    "created_at": "2025-01-15T11:00:00Z",
    "updated_at": "2025-01-15T11:00:00Z"
  }
]
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `401 Unauthorized`: User doesn't own the restaurant

---

### 11. Create Employee

Creates a new employee for a restaurant. **Owner only.**

**Endpoint:** `POST /restaurants/{restaurantID}/employees`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Request Body:**
```json
{
  "full_name": "Charlie Brown",
  "email": "charlie@example.com"
}
```

**Validation Rules:**
- `full_name`: Required, max 255 characters
- `email`: Required, valid email format, max 255 characters

**Success Response (201 Created):**
```json
{
  "id": 3,
  "restaurant_id": 5,
  "full_name": "Charlie Brown",
  "email": "charlie@example.com",
  "created_at": "2025-01-17T14:30:00Z",
  "updated_at": "2025-01-17T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `401 Unauthorized`: User is not the restaurant owner
- `400 Bad Request`: Validation failed

---

### 12. Get Employee by ID

Retrieves a specific employee.

**Endpoint:** `GET /restaurants/{restaurantID}/employees/{employeeID}`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `employeeID` (integer): The employee ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "full_name": "Alice Johnson",
  "email": "alice@example.com",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Employee or restaurant doesn't exist, or employee doesn't belong to this restaurant
- `401 Unauthorized`: User doesn't own the restaurant

---

### 13. Update Employee

Updates an employee's information. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}/employees/{employeeID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `employeeID` (integer): The employee ID

**Request Body:** (All fields optional)
```json
{
  "full_name": "Alice Johnson-Smith",
  "email": "alice.smith@example.com"
}
```

**Validation Rules:**
- `full_name`: Optional, max 255 characters
- `email`: Optional, valid email format, max 255 characters

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "full_name": "Alice Johnson-Smith",
  "email": "alice.smith@example.com",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-17T16:45:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Employee or restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner
- `400 Bad Request`: Validation failed

---

### 14. Delete Employee

Deletes an employee. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/employees/{employeeID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `employeeID` (integer): The employee ID

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Employee or restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner

---

### 15. Assign Roles to Employee

Assigns multiple roles to an employee. **Owner only.**

**Endpoint:** `POST /restaurants/{restaurantID}/employees/{employeeID}/roles`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `employeeID` (integer): The employee ID

**Request Body:**
```json
{
  "role_ids": [1, 2, 5]
}
```

**Validation Rules:**
- `role_ids`: Required, array of integers, each must be > 0

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Employee or restaurant doesn't exist
- `400 Bad Request`: One or more roles don't exist or don't belong to this restaurant
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Skips role assignments that already exist (idempotent)
- All roles must belong to the same restaurant
- Uses transaction to ensure atomicity

---

### 16. Remove Role from Employee

Removes a specific role from an employee. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/employees/{employeeID}/roles/{roleID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `employeeID` (integer): The employee ID
- `roleID` (integer): The role ID to remove

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Employee, role, or restaurant doesn't exist, or employee doesn't have this role
- `401 Unauthorized`: User is not the restaurant owner

---

## Role Management

### 17. Get All Roles

Retrieves all roles for a specific restaurant.

**Endpoint:** `GET /restaurants/{restaurantID}/roles`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "restaurant_id": 5,
    "name": "Server",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "restaurant_id": 5,
    "name": "Cook",
    "created_at": "2025-01-15T10:31:00Z",
    "updated_at": "2025-01-15T10:31:00Z"
  }
]
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it

---

### 18. Create Role

Creates a new role for a restaurant. **Owner only.**

**Endpoint:** `POST /restaurants/{restaurantID}/roles`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Request Body:**
```json
{
  "name": "Manager"
}
```

**Validation Rules:**
- `name`: Required, max 50 characters

**Success Response (201 Created):**
```json
{
  "id": 3,
  "restaurant_id": 5,
  "name": "Manager",
  "created_at": "2025-01-17T14:30:00Z",
  "updated_at": "2025-01-17T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `401 Unauthorized`: User is not the restaurant owner
- `400 Bad Request`: Validation failed

---

### 19. Get Role by ID

Retrieves a specific role.

**Endpoint:** `GET /restaurants/{restaurantID}/roles/{roleID}`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `roleID` (integer): The role ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "name": "Server",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Role or restaurant doesn't exist, or role doesn't belong to this restaurant

---

### 20. Update Role

Updates a role's information. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}/roles/{roleID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `roleID` (integer): The role ID

**Request Body:**
```json
{
  "name": "Senior Server"
}
```

**Validation Rules:**
- `name`: Optional, max 50 characters

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "name": "Senior Server",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-17T16:45:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Role or restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner
- `400 Bad Request`: Validation failed

---

### 21. Delete Role

Deletes a role. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/roles/{roleID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `roleID` (integer): The role ID

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Role or restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- May fail if role is assigned to employees or used in shift templates

---

## Shift Templates

Shift templates define recurring shift patterns (e.g., "Morning shift every Monday 9:00-17:00"). Templates can have multiple roles assigned and an optional name for easy identification.

### 22. Get All Shift Templates

Retrieves all shift templates for a specific restaurant with their assigned roles.

**Endpoint:** `GET /restaurants/{restaurantID}/shift-templates`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "restaurant_id": 5,
    "name": "Morning Shift",
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "17:00",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "roles": [
      {
        "id": 2,
        "restaurant_id": 5,
        "name": "Cook",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
      },
      {
        "id": 3,
        "restaurant_id": 5,
        "name": "Server",
        "created_at": "2025-01-15T10:01:00Z",
        "updated_at": "2025-01-15T10:01:00Z"
      }
    ]
  }
]
```

**Notes:**
- `name`: Optional, can be `null` (e.g., "Morning Shift", "Evening Shift")
- `day_of_week`: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- `start_time` and `end_time`: 24-hour format (HH:MM)
- `roles`: Array of roles assigned to this template
- Results are ordered by `day_of_week` and `start_time`

---

### 23. Create Shift Template

Creates a new shift template with multiple roles. **Owner only.**

**Endpoint:** `POST /restaurants/{restaurantID}/shift-templates`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Request Body:**
```json
{
  "name": "Morning Shift",
  "role_ids": [2, 3],
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00"
}
```

**Validation Rules:**
- `name`: Optional, max 255 characters (e.g., "Morning Shift", "Evening Shift")
- `role_ids`: Required, array with minimum 1 role, all must be > 0 and belong to this restaurant
- `day_of_week`: Required, integer 0-6 (0=Sunday, 6=Saturday)
- `start_time`: Required, 24-hour format HH:MM
- `end_time`: Required, 24-hour format HH:MM, must be after `start_time`

**Success Response (201 Created):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "name": "Morning Shift",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "created_at": "2025-01-17T14:30:00Z",
  "updated_at": "2025-01-17T14:30:00Z",
  "roles": [
    {
      "id": 2,
      "restaurant_id": 5,
      "name": "Cook",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 3,
      "restaurant_id": 5,
      "name": "Server",
      "created_at": "2025-01-15T10:01:00Z",
      "updated_at": "2025-01-15T10:01:00Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `400 Bad Request`: Validation failed, one or more roles don't exist or don't belong to this restaurant
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Requires at least 1 role in `role_ids` array
- All role assignments are created atomically using a transaction

---

### 24. Get Shift Template by ID

Retrieves a specific shift template with its assigned roles.

**Endpoint:** `GET /restaurants/{restaurantID}/shift-templates/{templateID}`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `templateID` (integer): The shift template ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "name": "Morning Shift",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "roles": [
    {
      "id": 2,
      "restaurant_id": 5,
      "name": "Cook",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 3,
      "restaurant_id": 5,
      "name": "Server",
      "created_at": "2025-01-15T10:01:00Z",
      "updated_at": "2025-01-15T10:01:00Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Template or restaurant doesn't exist, or template doesn't belong to this restaurant

---

### 25. Update Shift Template

Updates a shift template, including name and roles. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}/shift-templates/{templateID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `templateID` (integer): The shift template ID

**Request Body:** (All fields optional)
```json
{
  "name": "Evening Shift",
  "role_ids": [3, 4],
  "day_of_week": 2,
  "start_time": "10:00",
  "end_time": "18:00"
}
```

**Validation Rules:**
- `name`: Optional, max 255 characters (can be `null` to remove name)
- `role_ids`: Optional, if provided must have minimum 1 role, all must be > 0 and belong to this restaurant
- `day_of_week`: Optional, integer 0-6
- `start_time`: Optional, 24-hour format HH:MM
- `end_time`: Optional, 24-hour format HH:MM
- Final `end_time` must be after final `start_time`

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "name": "Evening Shift",
  "day_of_week": 2,
  "start_time": "10:00",
  "end_time": "18:00",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-17T16:45:00Z",
  "roles": [
    {
      "id": 3,
      "restaurant_id": 5,
      "name": "Server",
      "created_at": "2025-01-15T10:01:00Z",
      "updated_at": "2025-01-15T10:01:00Z"
    },
    {
      "id": 4,
      "restaurant_id": 5,
      "name": "Bartender",
      "created_at": "2025-01-15T10:02:00Z",
      "updated_at": "2025-01-15T10:02:00Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Template or restaurant doesn't exist
- `400 Bad Request`: Validation failed, one or more roles don't exist or don't belong to this restaurant
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- If `role_ids` is provided, all existing roles are removed and replaced with the new ones
- Requires at least 1 role if `role_ids` is specified

---

### 26. Delete Shift Template

Deletes a shift template. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/shift-templates/{templateID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `templateID` (integer): The shift template ID

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Template or restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner

---

## Schedule Management

Schedules represent weekly work schedules for a restaurant.

### 27. Get All Schedules

Retrieves all schedules for a specific restaurant.

**Endpoint:** `GET /restaurants/{restaurantID}/schedules`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "restaurant_id": 5,
    "start_date": "2025-01-20",
    "end_date": "2025-01-26",
    "published_at": "2025-01-17T14:30:00Z",
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T14:30:00Z"
  },
  {
    "id": 2,
    "restaurant_id": 5,
    "start_date": "2025-01-27",
    "end_date": "2025-02-02",
    "published_at": null,
    "created_at": "2025-01-17T11:00:00Z",
    "updated_at": "2025-01-17T11:00:00Z"
  }
]
```

**Notes:**
- Results are ordered by `start_date` descending (newest first)
- `published_at` is `null` if schedule hasn't been published yet
- Individual schedules are cached in Redis if enabled

---

### 28. Create Schedule

Creates a new schedule. **Owner only.**

**Endpoint:** `POST /restaurants/{restaurantID}/schedules`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID

**Request Body:**
```json
{
  "start_date": "2025-01-20",
  "end_date": "2025-01-26"
}
```

**Validation Rules:**
- `start_date`: Required, YYYY-MM-DD format
- `end_date`: Required, YYYY-MM-DD format, must be >= `start_date`

**Success Response (201 Created):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "start_date": "2025-01-20",
  "end_date": "2025-01-26",
  "published_at": null,
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-17T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Restaurant doesn't exist or user doesn't own it
- `400 Bad Request`: Invalid date format or end_date before start_date
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Schedule is cached after creation

---

### 29. Get Schedule by ID

Retrieves a specific schedule.

**Endpoint:** `GET /restaurants/{restaurantID}/schedules/{scheduleID}`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "start_date": "2025-01-20",
  "end_date": "2025-01-26",
  "published_at": "2025-01-17T14:30:00Z",
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-17T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Schedule or restaurant doesn't exist, or schedule doesn't belong to this restaurant

**Notes:**
- Uses Redis cache if available (falls back to database)

---

### 30. Update Schedule

Updates a schedule's dates. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}/schedules/{scheduleID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID

**Request Body:** (All fields optional)
```json
{
  "start_date": "2025-01-21",
  "end_date": "2025-01-27"
}
```

**Validation Rules:**
- `start_date`: Optional, YYYY-MM-DD format
- `end_date`: Optional, YYYY-MM-DD format
- Final `end_date` must be >= final `start_date`

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 5,
  "start_date": "2025-01-21",
  "end_date": "2025-01-27",
  "published_at": "2025-01-17T14:30:00Z",
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-18T09:15:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Schedule or restaurant doesn't exist
- `400 Bad Request`: Invalid date format or end_date before start_date
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Cache is updated after successful update

---

### 31. Delete Schedule

Deletes a schedule. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/schedules/{scheduleID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Schedule or restaurant doesn't exist
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Cascades to delete all scheduled shifts within this schedule
- Cache is cleared after deletion

---

### 32. Publish Schedule

Publishes a schedule, making it available to employees (sends notification emails).

**Endpoint:** `POST /restaurants/{restaurantID}/schedules/{scheduleID}/publish`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID

**Request Body:** None

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Schedule or restaurant doesn't exist
- `400 Bad Request`: Schedule is already published
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Sets `published_at` to current timestamp
- Cannot publish a schedule that's already published
- Cache is updated with the new published timestamp

---

## Scheduled Shifts

Scheduled shifts are individual shifts within a schedule.

### 33. Get All Scheduled Shifts

Retrieves all shifts for a specific schedule.

**Endpoint:** `GET /restaurants/{restaurantID}/schedules/{scheduleID}/shifts`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "schedule_id": 10,
    "shift_template_id": 5,
    "role_id": 2,
    "employee_id": 7,
    "shift_date": "2025-01-20T00:00:00Z",
    "start_time": "09:00",
    "end_time": "17:00",
    "notes": "Training session at 2pm",
    "created_at": "2025-01-17T10:30:00Z",
    "updated_at": "2025-01-17T10:30:00Z"
  }
]
```

**Notes:**
- Results are ordered by `shift_date` and `start_time`
- `employee_id` is `null` if shift is unassigned
- `shift_template_id` is `null` if shift was created manually (not from template)

---

### 34. Create Scheduled Shift

Creates a new scheduled shift. **Owner only.**

**Endpoint:** `POST /restaurants/{restaurantID}/schedules/{scheduleID}/shifts`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID

**Request Body:**
```json
{
  "shift_template_id": 5,
  "role_id": 2,
  "employee_id": 7,
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": "Training session at 2pm"
}
```

**Validation Rules:**
- `shift_template_id`: Optional (can be `null`)
- `role_id`: Required, must be > 0
- `employee_id`: Optional (can be `null` for unassigned shifts)
- `shift_date`: Required, ISO 8601 timestamp
- `start_time`: Required, HH:MM format, must be before `end_time`
- `end_time`: Required, HH:MM format
- `notes`: Optional string

**Success Response (201 Created):**
```json
{
  "id": 1,
  "schedule_id": 10,
  "shift_template_id": 5,
  "role_id": 2,
  "employee_id": 7,
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": "Training session at 2pm",
  "created_at": "2025-01-17T10:30:00Z",
  "updated_at": "2025-01-17T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid time format, end_time before start_time, or invalid schedule ID
- `401 Unauthorized`: User is not the restaurant owner
- `500 Internal Server Error`: Database error

---

### 35. Get Scheduled Shift by ID

Retrieves a specific scheduled shift.

**Endpoint:** `GET /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}`

**Authentication:** Required

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID
- `shiftID` (integer): The shift ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "schedule_id": 10,
  "shift_template_id": 5,
  "role_id": 2,
  "employee_id": 7,
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": "Training session at 2pm",
  "created_at": "2025-01-17T10:30:00Z",
  "updated_at": "2025-01-17T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Shift doesn't exist
- `400 Bad Request`: Invalid shift ID

---

### 36. Update Scheduled Shift

Updates a scheduled shift. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID
- `shiftID` (integer): The shift ID

**Request Body:** (All fields optional)
```json
{
  "shift_template_id": 6,
  "role_id": 3,
  "employee_id": 8,
  "shift_date": "2025-01-21T00:00:00Z",
  "start_time": "10:00",
  "end_time": "18:00",
  "notes": "Updated notes"
}
```

**Validation Rules:**
- All fields optional
- `start_time` and `end_time`: HH:MM format
- Final `end_time` must be after final `start_time`
- `shift_date`: ISO 8601 timestamp

**Success Response (200 OK):**
```json
{
  "id": 1,
  "schedule_id": 10,
  "shift_template_id": 6,
  "role_id": 3,
  "employee_id": 8,
  "shift_date": "2025-01-21T00:00:00Z",
  "start_time": "10:00",
  "end_time": "18:00",
  "notes": "Updated notes",
  "created_at": "2025-01-17T10:30:00Z",
  "updated_at": "2025-01-18T11:20:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Shift doesn't exist
- `400 Bad Request`: Invalid time format or end_time before start_time
- `401 Unauthorized`: User is not the restaurant owner

---

### 37. Delete Scheduled Shift

Deletes a scheduled shift. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID
- `shiftID` (integer): The shift ID

**Success Response (204 No Content):**
```
(Empty body)
```

**Error Responses:**
- `404 Not Found`: Shift doesn't exist
- `400 Bad Request`: Invalid shift ID
- `401 Unauthorized`: User is not the restaurant owner

---

### 38. Assign Employee to Shift

Assigns an employee to a scheduled shift. **Owner only.**

**Endpoint:** `PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID
- `shiftID` (integer): The shift ID

**Request Body:**
```json
{
  "employee_id": 7
}
```

**Validation Rules:**
- `employee_id`: Can be `null` to unassign, or a valid employee ID belonging to the restaurant

**Success Response (200 OK):**
```json
{
  "id": 1,
  "schedule_id": 10,
  "shift_template_id": 5,
  "role_id": 2,
  "employee_id": 7,
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": "Training session at 2pm",
  "created_at": "2025-01-17T10:30:00Z",
  "updated_at": "2025-01-18T14:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Shift doesn't exist
- `400 Bad Request`: Invalid employee ID or employee doesn't belong to restaurant
- `401 Unauthorized`: User is not the restaurant owner

**Notes:**
- Validates that employee belongs to the same restaurant as the shift
- Returns the updated shift object

---

### 39. Unassign Employee from Shift

Removes an employee assignment from a shift. **Owner only.**

**Endpoint:** `DELETE /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign`

**Authentication:** Required (Must be restaurant owner)

**URL Parameters:**
- `restaurantID` (integer): The restaurant ID
- `scheduleID` (integer): The schedule ID
- `shiftID` (integer): The shift ID

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "id": 1,
  "schedule_id": 10,
  "shift_template_id": 5,
  "role_id": 2,
  "employee_id": null,
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": "Training session at 2pm",
  "created_at": "2025-01-17T10:30:00Z",
  "updated_at": "2025-01-18T15:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Shift doesn't exist
- `401 Unauthorized`: User is not the restaurant owner

---

## Data Models

### User
```typescript
{
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  is_active: boolean;
}
```

### Restaurant
```typescript
{
  id: number;
  employer_id: number; // User ID of the owner
  name: string;
  address: string;
  phone: string | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  version: number; // For optimistic locking
}
```

### Employee
```typescript
{
  id: number;
  restaurant_id: number;
  full_name: string;
  email: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### Role
```typescript
{
  id: number;
  restaurant_id: number;
  name: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### ShiftTemplate (Response)
```typescript
{
  id: number;
  restaurant_id: number;
  name: string | null; // Optional name like "Morning Shift"
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // "HH:MM" in 24-hour format
  end_time: string; // "HH:MM" in 24-hour format
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  roles: Role[]; // Array of assigned roles
}
```

### Schedule
```typescript
{
  id: number;
  restaurant_id: number;
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  published_at: string | null; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### ScheduledShift
```typescript
{
  id: number;
  schedule_id: number;
  shift_template_id: number | null;
  role_id: number;
  employee_id: number | null;
  shift_date: string; // ISO 8601 timestamp
  start_time: string; // "HH:MM" in 24-hour format
  end_time: string; // "HH:MM" in 24-hour format
  notes: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

---

## Error Responses

All error responses follow this general format:

### 400 Bad Request
```json
{
  "error": "validation error message or invalid input description"
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "internal server error"
}
```

---

## Frontend Integration Examples

### Example 1: Complete User Registration Flow

```typescript
// 1. Register user
const registerResponse = await fetch(`${API_URL}/authentication/user`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    first_name: 'John',
    last_name: 'Doe',
    password: 'securePassword123'
  })
});

const userData = await registerResponse.json();
// userData.token contains the magic link token
// User receives email with link to: /confirm/{token}

// 2. User clicks link, frontend calls activation endpoint
const activateResponse = await fetch(
  `${API_URL}/users/activate/${token}`,
  { method: 'PUT' }
);

// 3. Now user can login
const loginResponse = await fetch(`${API_URL}/authentication/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'securePassword123'
  })
});

const jwtToken = await loginResponse.json();
// Store token for subsequent requests
localStorage.setItem('authToken', jwtToken);
```

---

### Example 2: Creating a Restaurant with Authentication

```typescript
const token = localStorage.getItem('authToken');

const response = await fetch(`${API_URL}/restaurants`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'My Restaurant',
    address: '123 Main St',
    phone: '+1-555-1234'
  })
});

const restaurant = await response.json();
console.log('Created restaurant:', restaurant);
```

---

### Example 3: Building a Weekly Schedule

```typescript
const token = localStorage.getItem('authToken');
const restaurantId = 5;

// 1. Create a schedule
const scheduleResponse = await fetch(
  `${API_URL}/restaurants/${restaurantId}/schedules`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      start_date: '2025-01-20',
      end_date: '2025-01-26'
    })
  }
);

const schedule = await scheduleResponse.json();

// 2. Add shifts to the schedule
const shiftResponse = await fetch(
  `${API_URL}/restaurants/${restaurantId}/schedules/${schedule.id}/shifts`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      role_id: 2,
      employee_id: 7,
      shift_date: '2025-01-20T00:00:00Z',
      start_time: '09:00',
      end_time: '17:00',
      notes: 'Morning shift'
    })
  }
);

const shift = await shiftResponse.json();

// 3. Publish the schedule
await fetch(
  `${API_URL}/restaurants/${restaurantId}/schedules/${schedule.id}/publish`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

---

### Example 4: Refreshing Expired Token

```typescript
const token = localStorage.getItem('authToken');

const refreshResponse = await fetch(`${API_URL}/authentication/refresh`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (refreshResponse.ok) {
  const newToken = await refreshResponse.json();
  localStorage.setItem('authToken', newToken);
} else {
  // Token refresh failed, redirect to login
  window.location.href = '/login';
}
```

---

## Rate Limiting

Rate limiting can be enabled via environment variables:
- `RATE_LIMITER_ENABLED`: Set to `true` to enable
- `RATELIMITER_REQUESTS_COUNT`: Maximum requests per time window

When rate limit is exceeded, the API returns `429 Too Many Requests`.

---

## CORS Configuration

The API accepts requests from the origin configured in `CORS_ALLOWED_ORIGIN` environment variable (default: `http://localhost:3000`).

Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

---

## Notes for Frontend Developers

1. **Authentication State Management:**
   - Store JWT token securely (consider `httpOnly` cookies for production)
   - Implement token refresh logic before expiration
   - Clear token on logout or 401 responses

2. **Error Handling:**
   - Always check response status codes
   - Display user-friendly error messages
   - Handle network errors gracefully

3. **Date/Time Formats:**
   - Dates: `YYYY-MM-DD` (e.g., "2025-01-20")
   - Times: `HH:MM` 24-hour format (e.g., "09:00", "17:30")
   - Timestamps: ISO 8601 (e.g., "2025-01-20T15:30:00Z")

4. **Ownership Rules:**
   - Only restaurant owners can create, update, or delete resources
   - Employees can only view data for restaurants they're associated with

5. **Optional Fields:**
   - Fields with `| null` or `?` are optional
   - Send `null` to clear optional fields during updates

6. **Caching:**
   - Backend uses Redis caching for restaurants and schedules
   - Frontend can implement optimistic updates for better UX

7. **Pagination:**
   - Currently no pagination is implemented
   - List endpoints return all records
   - Future versions may add pagination support

---

## Environment Variables Reference

Required for backend operation:

```bash
# Server
API_ADDR=:8080
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGIN=http://localhost:3000

# Database
DB_ADDR=postgres://admin:adminpassword@localhost:5432/resa?sslmode=disable

# Authentication
AUTH_TOKEN_SECRET=your-secret-key-here
AUTH_TOKEN_EXP=720h  # 30 days
AUTH_TOKEN_ISS=resa-api
AUTH_BASIC_USER=admin
AUTH_BASIC_PASS=admin

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@resa.com
MAIL_EXP=24h

# Redis (Optional)
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_ENABLED=true

# Rate Limiting (Optional)
RATE_LIMITER_ENABLED=false
RATELIMITER_REQUESTS_COUNT=100
```

---

**Last Updated:** November 2025 (Shift Templates updated to support multi-role assignments and optional names)
**API Version:** v1
**Swagger Documentation:** Available at `/v1/swagger/` (Basic Auth required)
