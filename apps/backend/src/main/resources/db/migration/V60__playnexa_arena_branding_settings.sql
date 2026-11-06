-- Dedicated-instance arena branding, never a shared SaaS tenant boundary.
-- Existing environment values remain defaults until an admin explicitly saves settings.
CREATE TABLE arena_branding_settings (
  id SMALLINT PRIMARY KEY CHECK(id=1),
  name VARCHAR(90),
  short_name VARCHAR(40),
  city VARCHAR(80),
  tagline VARCHAR(150),
  purpose VARCHAR(600),
  primary_color VARCHAR(7),
  accent_color VARCHAR(7),
  logo_url VARCHAR(2048),
  hero_image_url VARCHAR(2048),
  hero_video_url VARCHAR(2048),
  phone VARCHAR(30),
  sports_csv VARCHAR(1024),
  revision BIGINT NOT NULL DEFAULT 0 CHECK(revision >= 0),
  updated_by VARCHAR(180),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO arena_branding_settings(id) VALUES(1);
