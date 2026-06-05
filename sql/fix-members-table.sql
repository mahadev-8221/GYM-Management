-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This adds the missing trainer_id column to the members table

ALTER TABLE members
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id);
