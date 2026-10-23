-- FaceTrack AI: create the PostgreSQL role and databases (idempotent, never drops anything).
--
-- Run as a superuser (e.g. postgres) with psql, passing the app password as a variable:
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d postgres `
--       -v app_password="<the POSTGRES_PASSWORD from backend/.env>" -f scripts\create_database.sql
--
-- Optional variables: -v app_user=facetrack -v app_db=facetrack
-- pgAdmin users: see backend/README.md for the equivalent Query Tool steps.

\set ON_ERROR_STOP on
\if :{?app_user} \else \set app_user facetrack \endif
\if :{?app_db} \else \set app_db facetrack \endif
\if :{?app_password} \else
  \echo 'ERROR: pass the application password with  -v app_password=...'
  \quit
\endif

-- 1. Login role for the application: not a superuser, cannot create databases or roles.
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') \gexec

-- 2. App database + two test databases (pytest resets their schema, never the app database).
--    UTF-8 with ICU root collation sorts Latin and Khmer text sensibly on every OS.
SELECT format(
         'CREATE DATABASE %I OWNER %I ENCODING %L TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE %L',
         d, :'app_user', 'UTF8', 'und')
FROM unnest(ARRAY[:'app_db', :'app_db' || '_test', :'app_db' || '_test_mig']) AS d
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = d) \gexec

-- 3. Only the owner may connect (other roles on this server can't).
SELECT format('REVOKE CONNECT, TEMPORARY ON DATABASE %I FROM PUBLIC', d)
FROM unnest(ARRAY[:'app_db', :'app_db' || '_test', :'app_db' || '_test_mig']) AS d \gexec

\echo
\echo 'Databases owned by' :'app_user' ':'
SELECT datname, pg_encoding_to_char(encoding) AS encoding, datlocprovider AS provider, datlocale AS locale
FROM pg_database WHERE pg_get_userbyid(datdba) = :'app_user' ORDER BY datname;
