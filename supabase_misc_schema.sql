-- Create table for Mission Board
create table if not exists missions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  type text not null, -- 'service' or 'request'
  category text not null,
  title text not null,
  price numeric,
  description text,
  status text default 'active'
);

-- Enable Row Level Security (RLS)
alter table missions enable row level security;

-- Policy: Everyone can view active missions
create policy "Public missions are viewable by everyone"
  on missions for select
  using ( true );

-- Policy: Authenticated users can insert missions
create policy "Users can insert their own missions"
  on missions for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own missions
create policy "Users can update their own missions"
  on missions for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own missions
create policy "Users can delete their own missions"
  on missions for delete
  using ( auth.uid() = user_id );

-- Optional: Create a view or join logic in frontend to get user details
-- Assuming 'profiles' table exists and has 'email'
