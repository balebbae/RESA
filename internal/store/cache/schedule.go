package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-redis/redis/v8"
)

type ScheduleStore struct {
	rdb *redis.Client
}

const ScheduleExpTime = time.Minute // TODO: Change to 1 hour

func (s *ScheduleStore) Get(ctx context.Context, id int64) (*store.Schedule, error) {
	cacheKey := fmt.Sprintf("schedule-%v", id)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	var schedule store.Schedule
	if data != "" {
		err := json.Unmarshal([]byte(data), &schedule)
		if err != nil {
			return nil, err
		}
	}
		
	return &schedule, nil
}

func (s *ScheduleStore) Set(ctx context.Context, schedule *store.Schedule) error {
	if schedule.ID == 0 {
		return fmt.Errorf("schedule ID is required")
	}
	cacheKey := fmt.Sprintf("schedule-%d", schedule.ID)

	json, err := json.Marshal(schedule)
	if err != nil {
		return err
	}

	err = s.rdb.Set(ctx, cacheKey, json, ScheduleExpTime).Err()
	if err != nil {
		return err
	}

	return nil
}

func (s *ScheduleStore) Delete(ctx context.Context, id int64) error {
	cacheKey := fmt.Sprintf("schedule-%d", id)
	return s.rdb.Del(ctx, cacheKey).Err()
}
