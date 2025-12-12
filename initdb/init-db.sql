-- Auth Service Database
CREATE DATABASE sh_auth;
\c sh_auth

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS dblink;

-- Users table
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password VARCHAR(255),
                       username VARCHAR(255),
                       profile_picture VARCHAR(255),
                       is_google_user BOOLEAN
);
INSERT INTO users (email, password, username, is_google_user)
VALUES ('testuser@gmail.com', '$2a$10$mDJ7IlKMrQOV3wlIQ67qDecS3bW26AUVQIM/r.kJjKCLp/v5G1Q.O', 'Test User', false);


-- Finance Service Database
CREATE DATABASE sh_finance;
\c sh_finance
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS dblink;
