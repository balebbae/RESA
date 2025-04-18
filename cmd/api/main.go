// export PATH=$PATH:$(go env GOPATH)/bin

package main

import (
	"log"
	"time"

	"github.com/balebbae/RESA/internal/auth"
	"github.com/balebbae/RESA/internal/db"
	"github.com/balebbae/RESA/internal/env"
	"github.com/balebbae/RESA/internal/mailer"
	"github.com/balebbae/RESA/internal/store"
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
	godotenv.Load(".env")

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

	store := store.NewStorage(db)

	mailer := mailer.NewSendGrid(cfg.mail.sendGrid.apiKey, cfg.mail.fromEmail)


	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.auth.token.secret, 
		cfg.auth.token.iss, 
		cfg.auth.token.iss,
	)

	app := &application{
		config: cfg,
		store: store,
		logger: logger,
		mailer: mailer,
		authenticator: jwtAuthenticator,
	}

	mux := app.mount()

	log.Fatal(app.run(mux))
}