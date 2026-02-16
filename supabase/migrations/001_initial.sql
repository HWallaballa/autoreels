-- Profiles (auto-created on signup)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscription_id text,
  plan text default 'free',
  videos_used_this_month int default 0,
  billing_cycle_start timestamptz,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Connected TikTok accounts
create table tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  tiktok_user_id text not null,
  display_name text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  scopes text[],
  connected_at timestamptz default now()
);

alter table tiktok_accounts enable row level security;
create policy "Users can manage own accounts" on tiktok_accounts for all using (auth.uid() = user_id);

-- Generated videos
create table videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text,
  prompt text,
  template text,
  status text default 'pending',
  video_url text,
  duration_seconds int,
  generation_model text,
  generation_cost_cents int,
  voiceover_text text,
  captions text,
  replicate_prediction_id text,
  created_at timestamptz default now()
);

alter table videos enable row level security;
create policy "Users can manage own videos" on videos for all using (auth.uid() = user_id);

-- Scheduled posts
create table scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  video_id uuid references videos(id) on delete cascade not null,
  tiktok_account_id uuid references tiktok_accounts(id) on delete cascade not null,
  caption text,
  hashtags text[],
  scheduled_for timestamptz not null,
  status text default 'scheduled',
  tiktok_post_id text,
  error_message text,
  posted_at timestamptz,
  created_at timestamptz default now()
);

alter table scheduled_posts enable row level security;
create policy "Users can manage own posts" on scheduled_posts for all using (auth.uid() = user_id);

-- Video templates
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  prompt_template text,
  thumbnail_url text,
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table templates enable row level security;
create policy "Anyone can read public templates" on templates for select using (is_public = true);

-- Seed some templates
insert into templates (name, description, category, prompt_template, is_public) values
  ('Motivational Quote', 'Inspirational quote with cinematic background', 'motivational', 'Create a cinematic 10-second video of {{background_scene}} with the text "{{quote}}" appearing as elegant typography overlay. Dramatic lighting, slow motion.', true),
  ('Product Showcase', 'Sleek product reveal animation', 'product', 'A sleek, modern product showcase video of {{product_description}}. Clean white background, smooth 360-degree rotation, professional studio lighting. 10 seconds.', true),
  ('News Recap', 'Breaking news style short', 'news', 'A professional news broadcast style video about {{topic}}. Dynamic graphics, bold text overlays, urgent energy. 15 seconds.', true),
  ('Tutorial Tip', 'Quick how-to explainer', 'tutorial', 'A clean, modern tutorial video explaining {{topic}}. Step-by-step visual demonstration with clear text labels. Bright, friendly aesthetic. 15 seconds.', true),
  ('Before/After', 'Dramatic transformation reveal', 'transformation', 'A dramatic before-and-after transformation video showing {{transformation}}. Split screen effect, satisfying reveal, cinematic transition. 10 seconds.', true);
