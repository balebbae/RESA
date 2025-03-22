package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math/rand"

	"github.com/balebbae/RESA/internal/store"
)

// Sample data to randomize seeds
var firstNames = []string{
    "Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi",
    "Ivan", "Judy", "Karl", "Laura", "Mallory", "Nina", "Oscar", "Peggy",
    "Quinn", "Rachel", "Steve", "Trent", "Ursula", "Victor", "Wendy", "Xander",
    "Yvonne", "Zack",
}

var lastNames = []string{
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia",
    "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez",
    "Moore", "Martin", "Jackson", "Thompson", "White", "Lopez", "Lee", "Gonzalez",
    "Harris", "Clark", "Lewis",
}

var restaurantNames = []string{
    "Tasty Spoon", "Urban Bites", "Garden Gourmet", "Savory Delights", "Bistro Bliss",
    "Cozy Corner Café", "Epic Eats", "Hearty & Healthy", "Feast Factory", "Daily Dine",
    "Midtown Meals", "Morning Brew", "Sunset Supper", "Hungry Haven", "Famous Flavors",
}

var addresses = []string{
    "123 Main St", "456 Oak Ave", "789 Pine Rd", "101 Maple Ln", "202 Broadway Blvd",
    "303 Chestnut Dr", "404 Elm St", "505 Spruce Ct", "606 Cedar Way", "707 Birch Pl",
}

// Seed seeds your database with sample data:
// 1) Creates users (employers and employees).
// 2) Creates restaurants (linked to employers).
// 3) Optionally links random employees to restaurants via memberships.
func Seed(str store.Storage, db *sql.DB) {
    ctx := context.Background()

    // 1. Create a batch of users: some are employers, some are employees.
    employers := generateUsers(5, "employer")
    employees := generateUsers(15, "employee")

    // Start a transaction to create users
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        log.Printf("Error starting transaction: %v\n", err)
        return
    }

    // Create employer users
    for _, user := range employers {
        if createErr := str.User.Create(ctx, tx, user); createErr != nil {
            _ = tx.Rollback()
            log.Printf("Error creating employer user: %v\n", createErr)
            return
        }
    }

    // Create employee users
    for _, user := range employees {
        if createErr := str.User.Create(ctx, tx, user); createErr != nil {
            _ = tx.Rollback()
            log.Printf("Error creating employee user: %v\n", createErr)
            return
        }
    }

    // Commit user creation
    if err := tx.Commit(); err != nil {
        log.Printf("Error committing users transaction: %v\n", err)
        return
    }

    // 2. Create restaurants (owned by random employer).
    restaurants := generateRestaurants(10, employers)
    for _, rest := range restaurants {
        if err := str.Restaurant.Create(ctx, rest); err != nil {
            log.Printf("Error creating restaurant: %v\n", err)
            return
        }
    }

    // 3. Link some employees to restaurants via memberships.
    //    We'll add random employees to random restaurants.
    for i := 0; i < 20; i++ {
        // Pick a random restaurant and a random employee
        rIdx := rand.Intn(len(restaurants))
        eIdx := rand.Intn(len(employees))

        err := str.EmployeeMembership.CreateEmployeeToRestaurant(
            ctx,
            restaurants[rIdx].ID,
            employees[eIdx].ID,
        )
        if err != nil {
            log.Printf("Error creating employee membership: %v\n", err)
            return
        }
    }

    log.Println("Seeding complete!")
}

// generateUsers creates num users, all with the given roleName ("employer" or "employee").
func generateUsers(num int, roleName string) []*store.User {
    users := make([]*store.User, num)
    for i := 0; i < num; i++ {
        fn := firstNames[rand.Intn(len(firstNames))]
        ln := lastNames[rand.Intn(len(lastNames))]
        email := fmt.Sprintf("%s.%s%d@example.com", fn, ln, i)

        // Create a user with the specified role
        user := &store.User{
            Email:     email,
            FirstName: fn,
            LastName:  ln,
            Role: store.Role{
                Name: roleName, // "employer" or "employee"
            },
        }

        // Set a random password (or you could set them all the same)
        // The user.Password.Set() is called by store.Users.Create internally
        // if you want. Or set it here if you prefer:
        _ = user.Password.Set("password")

        users[i] = user
    }
    return users
}

// generateRestaurants creates num restaurants, each tied to a random employer.
func generateRestaurants(num int, employers []*store.User) []*store.Restaurant {
    rests := make([]*store.Restaurant, num)

    for i := 0; i < num; i++ {
        // Pick a random employer from the slice
        emp := employers[rand.Intn(len(employers))]

        phone := randomPhoneNumber()

        rests[i] = &store.Restaurant{
            EmployerID: emp.ID,
            Name:       restaurantNames[rand.Intn(len(restaurantNames))],
            Address:    addresses[rand.Intn(len(addresses))],
            Phone:      &phone, // pointer to phone string
        }
    }

    return rests
}

// randomPhoneNumber generates a simple random phone string for demonstration
func randomPhoneNumber() string {
    return fmt.Sprintf("555-%04d", rand.Intn(10000))
}
