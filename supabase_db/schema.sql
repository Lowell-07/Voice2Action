-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT,
  mobile TEXT,
  email TEXT,
  avatar_url TEXT,
  civic_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  department TEXT,
  issue_type TEXT,
  status TEXT DEFAULT 'Awaiting Approval',
  address TEXT,
  state TEXT,
  city TEXT,
  lat FLOAT,
  lng FLOAT,
  media_images TEXT[],
  reported_by UUID REFERENCES users(id),
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issue_embeddings table
CREATE TABLE IF NOT EXISTS issue_embeddings (
  id UUID PRIMARY KEY,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  embedding vector(768),
  content_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an HNSW vector index on issue_embeddings(embedding)
CREATE INDEX IF NOT EXISTS issue_embeddings_embedding_idx ON issue_embeddings USING hnsw (embedding vector_l2_ops);

-- Create an RPC function to match issues by embedding and distance
CREATE OR REPLACE FUNCTION match_issues(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_lat float,
  p_lng float,
  radius_meters float
)
RETURNS TABLE (
  id uuid,
  issue_id uuid,
  content_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ie.id,
    ie.issue_id,
    ie.content_text,
    1 - (ie.embedding <=> query_embedding) AS similarity
  FROM issue_embeddings ie
  JOIN issues i ON i.id = ie.issue_id
  WHERE 1 - (ie.embedding <=> query_embedding) > match_threshold
    AND (
      6371000 * 2 * asin(sqrt(
        power(sin(radians(i.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(i.lat)) *
        power(sin(radians(i.lng - p_lng) / 2), 2)
      ))
    ) < radius_meters
  ORDER BY ie.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
