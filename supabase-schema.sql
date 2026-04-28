-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric(12,2) not null,
  category text not null,
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Users access own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
