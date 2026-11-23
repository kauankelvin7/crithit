-- CritHit! — Bootstrap Inicial do Banco de Dados (PostgreSQL 16 + pgvector)
-- Executado automaticamente na primeira inicialização do volume PostgreSQL.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
