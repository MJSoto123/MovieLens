CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movies (
  movie_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  genres TEXT NOT NULL,
  imdb_id INTEGER,
  tmdb_id INTEGER
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  movie_id INTEGER NOT NULL REFERENCES movies(movie_id),
  rating NUMERIC(3,1) NOT NULL,
  rated_at TIMESTAMPTZ,
  source_timestamp BIGINT,
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
