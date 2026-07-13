-- ============================================================
--  Luxe Beauty Salon & Spa - Database Schema
--  PostgreSQL
-- ============================================================

-- Clean slate (safe re-run during development)
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS gallery CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;

-- ------------------------------------------------------------
--  Enums
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- ------------------------------------------------------------
--  Users (customers + admin share this table via `role`)
-- ------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(40),
  role          user_role NOT NULL DEFAULT 'customer',
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role);

-- ------------------------------------------------------------
--  Service Categories
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  slug        VARCHAR(90) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(60),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  Subcategories (a level under categories, e.g. Makeup → Bridal)
-- ------------------------------------------------------------
CREATE TABLE subcategories (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        VARCHAR(80) NOT NULL,
  slug        VARCHAR(90) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- ------------------------------------------------------------
--  Services
-- ------------------------------------------------------------
CREATE TABLE services (
  id               SERIAL PRIMARY KEY,
  category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id   INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
  name             VARCHAR(120) NOT NULL,
  description      TEXT,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  image_url        TEXT,
  -- vertical focal point (0=top .. 100=bottom) and zoom for card cropping
  image_pos_y      INTEGER NOT NULL DEFAULT 50,
  image_zoom       NUMERIC(4,2) NOT NULL DEFAULT 1,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_subcategory ON services(subcategory_id);
CREATE INDEX idx_services_featured ON services(is_featured);

-- ------------------------------------------------------------
--  Appointments
-- ------------------------------------------------------------
CREATE TABLE appointments (
  id               SERIAL PRIMARY KEY,
  customer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id       INTEGER REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes            TEXT,
  status           appointment_status NOT NULL DEFAULT 'pending',
  -- customer-requested new slot awaiting admin approval (NULL = none pending)
  reschedule_date  DATE,
  reschedule_time  TIME,
  -- snapshot of price/name at booking time (services may change later)
  price_snapshot   NUMERIC(10,2),
  service_name_snapshot VARCHAR(120),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- ------------------------------------------------------------
--  Reviews / Testimonials
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id  INTEGER REFERENCES services(id) ON DELETE SET NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_featured ON reviews(is_featured);

-- ------------------------------------------------------------
--  Gallery
-- ------------------------------------------------------------
CREATE TABLE gallery (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(120),
  description TEXT,
  category    VARCHAR(60),
  image_url   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  Promotions
-- ------------------------------------------------------------
CREATE TABLE promotions (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(120) NOT NULL,
  description   TEXT,
  discount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  image_url     TEXT,
  start_date    DATE,
  end_date      DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  Contact Messages
-- ------------------------------------------------------------
CREATE TABLE contact_messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(160) NOT NULL,
  phone      VARCHAR(40),
  subject    VARCHAR(160),
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
