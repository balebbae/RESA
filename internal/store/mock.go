package store

import (
	"context"
)

func NewMockStore() Storage {
	return Storage {
		Restaurants: &MockRestaurantStore{},
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