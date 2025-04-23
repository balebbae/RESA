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
	}
}

func NewRedisStorage(rdb *redis.Client) Storage {
	return Storage{
		Schedules: &ScheduleStore{rdb: rdb},
	}
}

