// export PATH=$PATH:$(go env GOPATH)/bin

package main

import (
	"context"
	"log"
	"time"

	"github.com/balebbae/RESA/internal/auth"
	"github.com/balebbae/RESA/internal/db"
	"github.com/balebbae/RESA/internal/env"
	"github.com/balebbae/RESA/internal/mailer"
	"github.com/balebbae/RESA/internal/store"
	"github.com/balebbae/RESA/internal/store/cache"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

const version = "0.0.1"

//	@title			RESA API
//	@description	API for Restaurant Employee Scheduling Application (RESA)
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@BasePath					/v1
//
//	@securityDefinitions.apiKey	ApiKeyAuth
//	@in							header
//	@name						Authorization
//	@description
func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println(err)
	}

	cfg := config{
		addr: env.GetString("ADDR", ":8080"),
		apiURL: env.GetString("EXTERNAL_URL", "localhost:8080"),
		frontendURL: env.GetString("FRONTEND_URL", "http://localhost:3000"),
		db: dbConfig{
			addr: env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost:5432/resa?sslmode=disable"),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxIdleTime: env.GetString("DB_MAX_IDLE_TIME", "15m"),
		},
		redisCfg: redisConfig{
			addr: env.GetString("REDIS_ADDR", "localhost:6379"),
			password: env.GetString("REDIS_PW", ""),
			db: env.GetInt("REDIS_DB", 0),
			enabled: env.GetBool("REDIS_ENABLED", true),
		},
		env: env.GetString("ENV", "development"),
		mail: mailConfig{
			exp: time.Hour * 24, // 1 day
			fromEmail: env.GetString("FROM_EMAIL", ""),
			sendGrid: sendGridConfig{
				apiKey: env.GetString("SENDGRID_API_KEY", ""),
			},
		},
		auth: authConfig{
			basic: basicConfig{
				user: env.GetString("AUTH_BASIC_USER", "admin"), // <= TODO:: change that to have no default 
				pass: env.GetString("AUTH_BASIC_PASS", "admin"),
			},
			token: tokenConfig{
				secret: env.GetString("AUTH_TOKEN_SECRET", "example"), // <= TODO:: SET SECRET no default
				exp: time.Hour * 24,
				iss: "RESA",
			},
		},
	}

	logger := zap.Must(zap.NewProduction()).Sugar()
	defer logger.Sync()


	db, err := db.New(
		cfg.db.addr,
		cfg.db.maxOpenConns,
		cfg.db.maxIdleConns,
		cfg.db.maxIdleTime,
	)
	if err != nil {
		logger.Fatal(err)
	}
 
	defer db.Close()
	
	logger.Info("db connection established")

	// Cache
	var rdb *redis.Client
	if cfg.redisCfg.enabled {
		rdb = cache.NewRedisClient(cfg.redisCfg.addr, cfg.redisCfg.password, cfg.redisCfg.db)
		logger.Info("redis connection established")

		defer rdb.Close()

		// Test Redis connection
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		
		_, err := rdb.Ping(ctx).Result()
		if err != nil {
			logger.Errorw("Failed to connect to Redis", "error", err)
			cfg.redisCfg.enabled = false
		}
	}

	store := store.NewStorage(db)
	var cacheStorage cache.Storage
	if cfg.redisCfg.enabled && rdb != nil {
		cacheStorage = cache.NewRedisStorage(rdb)
		logger.Infow("Redis cache enabled", 
			"addr", cfg.redisCfg.addr,
			"restaurants_nil", cacheStorage.Restaurants == nil)
	}

	mailer := mailer.NewSendGrid(cfg.mail.sendGrid.apiKey, cfg.mail.fromEmail)

	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.auth.token.secret, 
		cfg.auth.token.iss, 
		cfg.auth.token.iss,
	)

	app := &application{
		config: cfg,
		store: store,
		cacheStorage: cacheStorage,
		logger: logger,
		mailer: mailer,
		authenticator: jwtAuthenticator,
	}

	mux := app.mount()

	log.Fatal(app.run(mux))
}