# Gym Management System Setup Guide

This guide explains how to set up and run this Gym Management project on your local laptop or computer.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed:
1. **Node.js** (v16 or higher) – [Download Node.js](https://nodejs.org/)
2. **VS Code** (or your favorite IDE)
3. A **Supabase Account** – [Sign Up Free](https://supabase.com/)

---

## 📦 Setup Steps

### Step 1: Install Dependencies
Open your terminal inside the project directory (`new_project`) and run:
```bash
npm install
```

### Step 2: Set Up Supabase
Since this project uses Supabase for User Auth, Database Tables, and Storage, you need to create your own Supabase project:
1. Log in to the [Supabase Dashboard](https://database.new).
2. Create a new project.
3. Note down your project's **Project URL** and **API Key (anon public)**.

### Step 3: Run Database Schema SQL
1. In your Supabase Dashboard, go to **SQL Editor** on the left menu.
2. Click **New Query**.
3. Copy and paste the SQL script below and click **Run**:

```sql
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Holds Admin, Trainer, and Member User Profile Details)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    role TEXT CHECK (role IN ('admin', 'trainer', 'member')) NOT NULL DEFAULT 'member',
    status TEXT CHECK (status IN ('Pending', 'Active')) NOT NULL DEFAULT 'Pending',
    photo_url TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS (Row Level Security) on Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    name TEXT PRIMARY KEY,
    time_slot TEXT,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    batch TEXT REFERENCES public.batches(name) ON DELETE SET NULL,
    plan TEXT,
    expiry_date DATE,
    payment_status TEXT DEFAULT 'Pending',
    payment_method TEXT,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 6. Trainers Table
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    batch TEXT REFERENCES public.batches(name) ON DELETE SET NULL
);

-- 7. Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    name TEXT PRIMARY KEY,
    price NUMERIC NOT NULL
);

-- 8. Insert Default Plans
INSERT INTO public.plans (name, price) VALUES
('Monthly Gym', 1500),
('3 Months Gym', 4000),
('6 Months Gym', 7500),
('1 Year Gym', 13000)
ON CONFLICT (name) DO NOTHING;

-- 9. Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
    batch TEXT PRIMARY KEY REFERENCES public.batches(name) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    monday TEXT,
    tuesday TEXT,
    wednesday TEXT,
    thursday TEXT,
    friday TEXT,
    saturday TEXT,
    sunday TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT,
    amount NUMERIC,
    status TEXT DEFAULT 'Paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_role TEXT,
    message TEXT NOT NULL,
    type TEXT,
    batch TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    to_whom TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Enable RLS and Policies for other tables so the frontend can read/write directly
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Allow public read/write on members" ON public.members FOR ALL USING (true);
CREATE POLICY "Allow public read/write on trainers" ON public.trainers FOR ALL USING (true);
CREATE POLICY "Allow public read on plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Allow public read/write on schedules" ON public.schedules FOR ALL USING (true);
CREATE POLICY "Allow public read/write on payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Allow public read/write on notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Allow public read/write on feedback" ON public.feedback FOR ALL USING (true);
```

### Step 4: Configure Storage Bucket (For Profile Photos)
1. In the Supabase Dashboard, go to **Storage** on the left menu.
2. Click **New Bucket**.
3. Name it `profile_images` and make sure to toggle **Public Bucket** to **ON** (Public access).
4. Save the bucket.

### Step 5: Configure Auth Settings (Email Verification)
Since local development testing is faster without email verification loops:
1. In the Supabase Dashboard, go to **Authentication** > **Providers** > **Email**.
2. Turn off **Confirm Email** (Disable email verification so registered users can log in instantly without waiting for a confirmation email).
3. Save changes.

### Step 6: Create Your Admin Account
To access the Admin dashboard:
1. Go to **Authentication** > **Users** in Supabase and click **Add User** -> **Create User**.
2. Set the email to your preferred admin email (e.g. `praveen1@gmail.com`) and password `123456`.
3. In **Table Editor** > **profiles** table, locate the row for the newly created user:
   - Double click the **role** column and set it to `admin`.
   - Double click the **status** column and set it to `Active`.
4. Click Save. You can now log in as Admin!

---

## 🚀 Running the Project

### Step 7: Update Credentials
Update the credentials in your local files to connect to your Supabase project:
1. Edit the `.env` file in the project folder and replace `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with your project's URL and Key.
2. The HTML files in `public/` directory have already been configured to read from this project.
   
Tip: copy the example environment file and edit it:

```bash
cp .env.example .env
# then edit .env with your Supabase values
```

### Step 8: Start the Server
Run the following command in the project directory:
```bash
npm start
```

Your web app will be accessible at: **http://localhost:3000**
