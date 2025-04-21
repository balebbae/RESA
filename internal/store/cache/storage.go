package cache

import (
	"context"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-redis/redis/v8"
)

type Storage struct {
	Restaurants interface {
		Get(context.Context, int64) (*store.Restaurant, error)
		Set(context.Context, *store.Restaurant) error
	}
}

func NewRedisStorage(rdb *redis.Client) Storage {
	return Storage{
		Restaurants: &RestaurantStore{rdb: rdb},
	}
}

