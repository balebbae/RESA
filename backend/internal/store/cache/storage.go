package cache

import (
	"context"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-redis/redis/v8"
)

type Storage struct {
	Schedules interface {
		Get(context.Context, int64) (*store.Schedule, error)
		Set(context.Context, *store.Schedule) error
		Delete(context.Context, int64) error
	}
	Restaurants interface {
		Get(context.Context, int64) (*store.Restaurant, error)
		Set(context.Context, *store.Restaurant) error
		Delete(context.Context, int64) error
	}
}

func NewRedisStorage(rdb *redis.Client) Storage {
	return Storage{
		Schedules: &ScheduleStore{rdb: rdb},
		Restaurants: &RestaurantStore{rdb: rdb},
	}
}


