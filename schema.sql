-- ============================================================
-- AVN TRACK — Supabase Schema
-- Project: uqrolrtrfdjcjpaovpln (Mumbai)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- One row per user. Extends Supabase auth.users.
-- ============================================================
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,

  -- Personal
  full_name           text,
  date_of_birth       date,
  gender              text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  country             text,

  -- Diagnosis
  diagnosis_date      date,
  avascular_stage     text check (avascular_stage in ('stage_0', 'stage_1', 'stage_2', 'stage_3', 'stage_4', 'unknown')),
  primary_cause       text, -- steroid_use, alcohol, trauma, sickle_cell, idiopathic, other

  -- Affected joints — supports hip, knee, shoulder, wrist, ankle, jaw
  -- Array of joint identifiers e.g. ['left_hip', 'right_hip', 'left_knee']
  affected_joints     text[] default '{}',

  -- Surgical status per joint — JSONB for flexibility
  -- Shape: { "left_hip": { "status": "post_thr", "surgery_date": "2024-01-15", "implant_brand": "Stryker", "implant_type": "ceramic_on_poly" },
  --          "right_hip": { "status": "pre_surgical" } }
  surgical_status     jsonb default '{}',

  -- Onboarding complete flag
  onboarding_done     boolean default false,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. PAIN LOGS
-- One row per log entry. Users can log multiple times per day
-- but UI encourages once daily.
-- ============================================================
create table public.pain_logs (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references public.profiles(id) on delete cascade not null,

  logged_at               timestamptz default now(),
  log_date                date default current_date, -- for easy daily queries

  -- Location: array of selected zones
  -- e.g. ['left_groin', 'right_buttock', 'left_thigh']
  -- Supported values: left_groin, right_groin, left_buttock, right_buttock,
  --                   left_thigh, right_thigh, left_knee, right_knee,
  --                   left_shoulder, right_shoulder, left_wrist, right_wrist, other
  locations               text[] default '{}',

  -- Pain intensity 1-10
  intensity               smallint check (intensity between 1 and 10),

  -- What triggered the pain today
  -- Values: walking, stairs, sitting, standing, lying_down, weather, nothing, other
  triggers                text[] default '{}',

  -- What provided relief
  -- Values: rest, ice, heat, medication, elevation, physiotherapy, nothing, other
  relief                  text[] default '{}',

  -- Was a post-surgical joint the primary pain source today
  post_surgical_pain      boolean default false,

  -- Free text notes
  notes                   text,

  created_at              timestamptz default now()
);

alter table public.pain_logs enable row level security;

create policy "Users can manage own pain logs"
  on public.pain_logs for all
  using (auth.uid() = user_id);

-- Index for fast date-range queries (dashboard charts)
create index pain_logs_user_date on public.pain_logs(user_id, log_date desc);


-- ============================================================
-- 3. EXERCISES LIBRARY
-- Pre-seeded by us. Not user-specific.
-- ============================================================
create table public.exercises_library (
  id                  uuid primary key default uuid_generate_v4(),

  name                text not null,
  description         text,        -- one-line benefit description
  instructions        text,        -- how to perform
  image_url           text,        -- future: exercise illustration

  -- Duration / reps
  default_sets        smallint,
  default_reps        smallint,
  default_duration_s  int,         -- duration in seconds (for timed exercises)

  -- Who this exercise is for
  category            text check (category in ('pre_surgical', 'post_thr', 'general_avn', 'all')),
  applicable_joints   text[],      -- ['hip', 'knee', 'shoulder']

  -- Safety
  warning             text default 'Stop immediately if you feel sharp pain.',
  contraindications   text[],      -- ['deep_hip_flexion', 'impact', 'weight_bearing']

  -- Display order
  order_index         smallint default 0,

  is_active           boolean default true,
  created_at          timestamptz default now()
);

-- Public read access — all users see the same library
alter table public.exercises_library enable row level security;

create policy "Anyone can read exercise library"
  on public.exercises_library for select
  using (true);


-- ============================================================
-- 4. EXERCISE LOGS
-- One row per exercise completed or skipped per session.
-- ============================================================
create table public.exercise_logs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.profiles(id) on delete cascade not null,
  exercise_id         uuid references public.exercises_library(id),

  logged_at           timestamptz default now(),
  log_date            date default current_date,

  -- Completion
  sets_completed      smallint,
  reps_completed      smallint,
  duration_s          int,

  -- Pain during exercise (null = no pain noted)
  pain_during         smallint check (pain_during between 1 and 10),

  -- Skipped?
  skipped             boolean default false,
  skip_reason         text, -- 'sharp_pain', 'fatigue', 'not_prescribed', 'other'

  notes               text,
  created_at          timestamptz default now()
);

alter table public.exercise_logs enable row level security;

create policy "Users can manage own exercise logs"
  on public.exercise_logs for all
  using (auth.uid() = user_id);

create index exercise_logs_user_date on public.exercise_logs(user_id, log_date desc);


-- ============================================================
-- 5. SEED — EXERCISE LIBRARY
-- Standard AVN-safe exercises, curated from physio literature.
-- ============================================================
insert into public.exercises_library
  (name, description, instructions, default_sets, default_reps, default_duration_s, category, applicable_joints, warning, contraindications, order_index)
values

-- POST-THR SPECIFIC (safe after total hip replacement)
(
  'Ankle Pumps',
  'Improves blood circulation and reduces clot risk post-surgery.',
  'Lying flat on your back. Flex your foot upward pulling toes toward you, hold 2 seconds. Then push foot downward away from you, hold 2 seconds. Alternate rhythmically.',
  3, 15, null,
  'post_thr', array['hip'],
  'Stop immediately if you feel sharp pain or swelling increases.',
  array['none'],
  1
),
(
  'Quad Sets',
  'Activates thigh muscles without stressing the hip joint.',
  'Lying on your back with legs straight. Tighten the thigh muscle of your operated leg by pressing the back of your knee toward the bed. Hold 5 seconds, release.',
  3, 10, null,
  'post_thr', array['hip'],
  'Stop immediately if you feel sharp pain.',
  array['none'],
  2
),
(
  'Heel Slides',
  'Restores gentle hip and knee flexion after surgery.',
  'Lying on your back. Slowly slide your heel toward your buttocks by bending your knee and hip. Stop before 90 degrees of hip flexion. Slowly slide back.',
  2, 10, null,
  'post_thr', array['hip'],
  'Do not bend your hip past 90 degrees. Stop at discomfort.',
  array['deep_hip_flexion'],
  3
),
(
  'Short Arc Quads',
  'Strengthens the quadriceps with minimal hip load.',
  'Lying on your back with a rolled towel under your knee. Straighten your leg by lifting your heel off the bed. Hold 5 seconds, lower slowly.',
  3, 10, null,
  'post_thr', array['hip', 'knee'],
  'Stop immediately if you feel sharp pain.',
  array['none'],
  4
),

-- GENERAL AVN (safe for pre-surgical and general management)
(
  'Clamshells',
  'Strengthens hip abductors to improve joint stability.',
  'Lying on your side with hips and knees bent at 45 degrees. Keep feet together and rotate your top knee upward like a clamshell opening. Do not rotate your pelvis. Lower slowly.',
  3, 12, null,
  'general_avn', array['hip'],
  'Stop immediately if you feel sharp pain in the hip.',
  array['none'],
  5
),
(
  'Glute Bridges',
  'Strengthens glutes and core without hip joint compression.',
  'Lying on your back with knees bent and feet flat. Squeeze your glutes and lift your hips until your body forms a straight line from knees to shoulders. Hold 3 seconds, lower slowly.',
  3, 10, null,
  'general_avn', array['hip'],
  'Do not arch your lower back. Stop if sharp hip pain occurs.',
  array['none'],
  6
),
(
  'Seated Leg Raises',
  'Builds hip flexor strength in a low-impact position.',
  'Sitting upright in a firm chair with feet flat. Slowly lift one leg until it is parallel to the floor. Hold 3 seconds, lower slowly. Alternate legs.',
  2, 10, null,
  'general_avn', array['hip'],
  'Keep your back straight. Stop if sharp groin pain occurs.',
  array['none'],
  7
),
(
  'Standing Hip Abduction',
  'Improves lateral hip stability and gait.',
  'Standing holding a chair for support. Slowly lift your leg out to the side, keeping your toes forward and back straight. Do not lean. Lower slowly.',
  3, 10, null,
  'general_avn', array['hip'],
  'Use chair support. Do not raise leg above hip height. Stop if pain increases.',
  array['impact'],
  8
),

-- PRE-SURGICAL
(
  'Hip Flexor Stretch',
  'Reduces hip flexor tightness and improves range of motion.',
  'Standing holding a chair. Step one foot back into a gentle lunge position. Keep your back straight and gently push your hips forward until you feel a stretch at the front of the back hip. Hold 20 seconds.',
  2, null, 20,
  'pre_surgical', array['hip'],
  'Do not force the stretch. Only mild tension is acceptable — never sharp pain.',
  array['deep_hip_flexion'],
  9
),
(
  'Supine Hip Rotation',
  'Maintains hip joint mobility before surgery.',
  'Lying on your back with knees bent and feet flat. Gently let both knees fall to one side until you feel a mild stretch. Hold 10 seconds. Return to center and repeat other side.',
  2, null, 10,
  'pre_surgical', array['hip'],
  'Only mild discomfort is acceptable. Stop if sharp pain occurs.',
  array['none'],
  10
);


-- ============================================================
-- 6. UPDATED_AT TRIGGER for profiles
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ============================================================
-- DONE
-- Tables created: profiles, pain_logs, exercises_library, exercise_logs
-- RLS enabled on all tables
-- 10 exercises seeded
-- Auto profile creation on signup configured
-- ============================================================
