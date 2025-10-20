package store

import (
	"context"
	"database/sql"
	"time"
)

func NewMockStore() Storage {
	return Storage {
		Restaurants: &MockRestaurantStore{},
		Users: &MockUserStore{},
	}
}

type MockRestaurantStore struct {}

func (s *MockRestaurantStore) Create(ctx context.Context, restaurant *Restaurant) error {
	return nil
}

func (s *MockRestaurantStore) GetByID(ctx context.Context, id int64) (*Restaurant, error) {
	return &Restaurant{ID: id}, nil
}

func (s *MockRestaurantStore) Update(ctx context.Context, restaurant *Restaurant) error {
	return nil

}

func (s *MockRestaurantStore) Delete(ctx context.Context, id int64) error {
	return nil
}	

func (s *MockRestaurantStore) ListByUser(ctx context.Context, userID int64) ([]*Restaurant, error) {
	return []*Restaurant{}, nil
}

type MockUserStore struct {}

func (s *MockUserStore) Create(ctx context.Context, tx *sql.Tx, user *User) error {
	user.ID = 1
	return nil
}

func (s *MockUserStore) GetByID(ctx context.Context, id int64) (*User, error) {
	return &User{ID: id, FirstName: "Test", LastName: "User", Email: "test@example.com"}, nil
}

func (s *MockUserStore) GetByEmail(ctx context.Context, email string) (*User, error) {
	return &User{ID: 1, FirstName: "Test", LastName: "User", Email: email}, nil
}

func (s *MockUserStore) CreateAndInvite(ctx context.Context, user *User, token string, exp time.Duration) error {
	user.ID = 1
	return nil
}

func (s *MockUserStore) Update(ctx context.Context, user *User) error {
	return nil
}

func (s *MockUserStore) Delete(ctx context.Context, id int64) error {
	return nil
}

func (s *MockUserStore) Activate(ctx context.Context, token string) error {
	return nil
}

func (s *MockUserStore) GetByGoogleID(ctx context.Context, googleID string) (*User, error) {
	return &User{ID: 1, FirstName: "Test", LastName: "User", Email: "test@example.com"}, nil
}

func (s *MockUserStore) CreateWithGoogle(ctx context.Context, tx *sql.Tx, user *User, googleID, avatarURL string) error {
	user.ID = 1
	return nil
}

func (s *MockUserStore) CreateUserWithGoogle(ctx context.Context, user *User, googleID, avatarURL string) error {
	user.ID = 1
	return nil
}

func (s *MockUserStore) LinkGoogleAccount(ctx context.Context, userID int64, googleID, avatarURL string) error {
	return nil
}