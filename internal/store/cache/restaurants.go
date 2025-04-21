package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-redis/redis/v8"
)

type RestaurantStore struct {
	rdb *redis.Client
}

const UserExpTime = time.Minute

func (s *RestaurantStore) Get(ctx context.Context, id int64) (*store.Restaurant, error) {
	cacheKey := fmt.Sprintf("restaurant-%d", id)
	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err != nil {
		return nil, err
	}

	var restaurant store.Restaurant
	if data != "" {
		err := json.Unmarshal([]byte(data), &restaurant)
		if err != nil {
			return nil, err
		}
	}
		
	return &restaurant, nil
}

func (s *RestaurantStore) Set(ctx context.Context, restaurant *store.Restaurant) error {
	if restaurant.ID == 0 {
		return fmt.Errorf("restaurant ID is required")
	}
	cacheKey := fmt.Sprintf("restaurant-%d", restaurant.ID)

	json, err := json.Marshal(restaurant)
	if err != nil {
		return err
	}

	err = s.rdb.Set(ctx, cacheKey, json, UserExpTime).Err()
	if err != nil {
		return err
	}

	return nil
}
