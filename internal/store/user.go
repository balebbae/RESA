package store

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrDuplicateEmail = errors.New("a user with that email already exists")
	ErrDuplicateUsername = errors.New("a user with that username already exists")
)

type User struct {
	ID int64 `db:"id" json:"id"`
	Email string `db:"email" json:"email"`
	Password password `db:"password" json:"-"`
	FirstName string `db:"first_name" json:"first_name"`
	LastName string `db:"last_name" json:"last_name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
	IsActive bool `db:"is_active" json:"is_active"`
	GoogleID *string `db:"google_id" json:"google_id,omitempty"`
	AvatarURL *string `db:"avatar_url" json:"avatar_url,omitempty"`
}

type password struct {
	text *string
	hash []byte
}

func (p *password) Compare(text string) error {
	return bcrypt.CompareHashAndPassword(p.hash, []byte(text))
}

func (p *password) Set(text string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(text), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	p.text = &text
	p.hash = hash
	
	return nil
}

type UserStore struct {
	db *sql.DB
}

func (s *UserStore) Create(ctx context.Context, tx *sql.Tx, user *User) error {
	query := `
		INSERT INTO users (email, password, first_name, last_name) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id, created_at
		`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := tx.QueryRowContext(
		ctx,
		query,
		user.Email,
		user.Password.hash,
		user.FirstName,
		user.LastName,
	).Scan(
		&user.ID,
		&user.CreatedAt,
	)

	if err != nil {
		switch {
		case err.Error() == `pq: duplicate key value violates unique constraint "users_email_key"`:
			return ErrDuplicateEmail
		case err.Error() == `pq: duplicate key value violates unique constraint "users_username_key"`:
			return ErrDuplicateUsername
		default:
			return err
		}
	}

	return nil
}


func (s *UserStore) GetByID(ctx context.Context, userID int64) (*User, error) {
	query := `
		SELECT users.id, email, password, first_name, last_name, created_at
		FROM users 
		WHERE users.id = $1 AND is_active = true;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	user := &User{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		userID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Password.hash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
	)

	if err != nil {
		switch err {
		case sql.ErrNoRows:
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return user, nil
}

func (s *UserStore) CreateAndInvite(ctx context.Context, user *User, token string, invitationExp time.Duration) error {
	return withTx(s.db, ctx, func(tx *sql.Tx) error {
		if err := s.Create(ctx, tx, user); err != nil {
			return err
		}

		if err := s.createUserInvitation(ctx, tx, token, invitationExp,user.ID); err != nil {
			return err
		}

		return nil
	})
}

func (s *UserStore) Activate(ctx context.Context, token string) error {
	return withTx(s.db, ctx, func(tx *sql.Tx) error {
	// 1. find the user that this token belongs to
		user, err := s.getUserFromInvitation(ctx, tx, token)
		if err != nil {
			return err
		}

	// 2. update the user
		user.IsActive = true
		if err := s.update(ctx, tx, user); err != nil {
			return err
		}

	// 3. clean the invitations
		if err := s.deleteUserInvitations(ctx, tx, user.ID); err != nil {
			return err
		}

		return nil
	})
}

func (s *UserStore) ResendInvitation(ctx context.Context, email string, token string, invitationExp time.Duration) (*User, error) {
	var user *User
	err := withTx(s.db, ctx, func(tx *sql.Tx) error {
		// 1. get user by email (including inactive users)
		var err error
		user, err = s.GetByEmailIncludingInactive(ctx, email)
		if err != nil {
			return err
		}

		// 2. ensure user is inactive (active users don't need confirmation)
		if user.IsActive {
			return errors.New("user is already active")
		}

		// 3. delete old invitation tokens
		if err := s.deleteUserInvitations(ctx, tx, user.ID); err != nil {
			return err
		}

		// 4. create new invitation token
		if err := s.createUserInvitation(ctx, tx, token, invitationExp, user.ID); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserStore) getUserFromInvitation(ctx context.Context, tx *sql.Tx, token string) (*User, error) {
	query := `
		SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, u.is_active
		FROM users u
		JOIN user_invitations ui ON u.id = ui.user_id
		WHERE ui.token = $1 AND ui.expiry > $2;	
	`

	hash := sha256.Sum256([]byte(token))
	hashToken := hex.EncodeToString(hash[:])

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	user := &User{}
	err := tx.QueryRowContext(ctx, query, hashToken, time.Now()).Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.IsActive,
	)
	if err != nil {
		switch err {
		case sql.ErrNoRows:
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return user, nil
}

func (s *UserStore) createUserInvitation(ctx context.Context, tx *sql.Tx, token string, exp time.Duration, userID int64) error {
	query := `INSERT INTO user_invitations (token, user_id, expiry) VALUES ($1, $2, $3);`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := tx.ExecContext(ctx, query, token, userID, time.Now().Add(exp))
	if err != nil {
		return err
	}

	return nil
}

func (s *UserStore) update(ctx context.Context, tx *sql.Tx, user *User) error {
	query := `UPDATE users SET email = $1, first_name = $2, last_name = $3, is_active = $4 WHERE id = $5`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := tx.ExecContext(ctx, query, user.Email, user.FirstName, user.LastName, user.IsActive, user.ID)
	if err != nil {
		return err
	}

	return nil
}

func (s *UserStore) deleteUserInvitations(ctx context.Context, tx *sql.Tx, userID int64) error {
	query := `DELETE FROM user_invitations WHERE user_id = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := tx.ExecContext(ctx, query, userID)
	if err != nil {
		return err
	}

	return nil
}

func (s *UserStore) Delete(ctx context.Context, userID int64) error {
	return withTx(s.db, ctx, func(tx *sql.Tx) error {
		if err := s.delete(ctx, tx, userID); err != nil {
			return err
		}

		if err := s.deleteUserInvitations(ctx, tx, userID); err != nil {
			return err
		}

		return nil
	})
}

func (s *UserStore) delete(ctx context.Context, tx *sql.Tx, id int64) error {
	query := `DELETE FROM users WHERE id = $1;`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := tx.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	return nil
}

func (s *UserStore) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
	SELECT id, email, password, first_name, last_name, created_at, google_id, avatar_url
		FROM users
	WHERE email = $1 AND is_active = true;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	user := &User{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		email,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Password.hash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.GoogleID,
		&user.AvatarURL,
	)

	if err != nil {
		switch err {
		case sql.ErrNoRows:
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return user, nil
}

// GetByEmailIncludingInactive retrieves a user by email, including inactive users
// Used for OAuth account linking to find existing unactivated accounts
func (s *UserStore) GetByEmailIncludingInactive(ctx context.Context, email string) (*User, error) {
	query := `
	SELECT id, email, password, first_name, last_name, created_at, google_id, avatar_url, is_active
		FROM users
	WHERE email = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	user := &User{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		email,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Password.hash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.GoogleID,
		&user.AvatarURL,
		&user.IsActive,
	)

	if err != nil {
		switch err {
		case sql.ErrNoRows:
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return user, nil
}

// GetByGoogleID retrieves a user by their Google ID
func (s *UserStore) GetByGoogleID(ctx context.Context, googleID string) (*User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, created_at, google_id, avatar_url
		FROM users
		WHERE google_id = $1 AND is_active = true;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	user := &User{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		googleID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Password.hash,
		&user.FirstName,
		&user.LastName,
		&user.CreatedAt,
		&user.GoogleID,
		&user.AvatarURL,
	)

	if err != nil {
		switch err {
		case sql.ErrNoRows:
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return user, nil
}

// CreateWithGoogle creates a new user with Google OAuth (no password required)
// User is automatically activated since Google has verified their email
func (s *UserStore) CreateWithGoogle(ctx context.Context, tx *sql.Tx, user *User, googleID, avatarURL string) error {
	query := `
		INSERT INTO users (email, first_name, last_name, google_id, avatar_url, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id, created_at
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := tx.QueryRowContext(
		ctx,
		query,
		user.Email,
		user.FirstName,
		user.LastName,
		googleID,
		avatarURL,
	).Scan(
		&user.ID,
		&user.CreatedAt,
	)

	if err != nil {
		switch {
		case err.Error() == `pq: duplicate key value violates unique constraint "users_email_key"`:
			return ErrDuplicateEmail
		case err.Error() == `pq: duplicate key value violates unique constraint "users_google_id_key"`:
			return errors.New("a user with that Google account already exists")
		default:
			return err
		}
	}

	user.GoogleID = &googleID
	user.AvatarURL = &avatarURL
	user.IsActive = true

	return nil
}

// LinkGoogleAccount links a Google account to an existing user
func (s *UserStore) LinkGoogleAccount(ctx context.Context, userID int64, googleID, avatarURL string) error {
	query := `
		UPDATE users
		SET google_id = $1, avatar_url = $2, updated_at = NOW()
		WHERE id = $3
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	result, err := s.db.ExecContext(ctx, query, googleID, avatarURL, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// CreateUserWithGoogle creates a new user with Google OAuth in a transaction
func (s *UserStore) CreateUserWithGoogle(ctx context.Context, user *User, googleID, avatarURL string) error {
	return withTx(s.db, ctx, func(tx *sql.Tx) error {
		return s.CreateWithGoogle(ctx, tx, user, googleID, avatarURL)
	})
}