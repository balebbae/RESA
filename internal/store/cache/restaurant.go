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

const RestaurantExpTime = time.Hour // TODO: Change to 1 hour

func (s *RestaurantStore) Get(ctx context.Context, id int64) (*store.Restaurant, error) {
	cacheKey := fmt.Sprintf("restaurant-%v", id)

	data, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil
	} else if err != nil {
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
	cacheKey := fmt.Sprintf("restaurant-%d", restaurant.ID)

	json, err := json.Marshal(restaurant)
	if err != nil {
		return err
	}

	return s.rdb.SetEX(ctx, cacheKey, json, RestaurantExpTime).Err()
}

func (s *RestaurantStore) Delete(ctx context.Context, id int64) error {
	cacheKey := fmt.Sprintf("restaurant-%d", id)
	return s.rdb.Del(ctx, cacheKey).Err()
}
