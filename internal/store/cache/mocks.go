package cache

import (
	"context"

	"github.com/balebbae/RESA/internal/store"
)

func NewMockStore() Storage {
	return Storage{
		Restaurants: &MockRestaurantStore{},
		Schedules: &MockScheduleStore{},
	}
}

type MockRestaurantStore struct {}
type MockScheduleStore struct {}

func (m MockRestaurantStore) Get(ctx context.Context, id int64) (*store.Restaurant, error) {
	return nil, nil 
}

func (m MockRestaurantStore) Set(ctx context.Context, restaurant *store.Restaurant) error {
	return nil 
}

func (m MockRestaurantStore) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m MockScheduleStore) Get(ctx context.Context, id int64) (*store.Schedule, error) {
	return nil, nil 
}

func (m MockScheduleStore) Set(ctx context.Context, schedule *store.Schedule) error {
	return nil 
}

func (m MockScheduleStore) Delete(ctx context.Context, id int64) error {
	return nil
}

