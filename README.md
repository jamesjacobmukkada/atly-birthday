# 🎂 Atly's 30th Birthday Escape Game — Deployment Guide

This is a complete React web app with:
- A birthday landing page for Atly with a countdown to June 15th
- A quote submission page where friends roast him + see all submitted quotes
- A maze escape game that unlocks on June 15th — Atly dodges flying quotes from friends

---

## STEP 1: Set up the free database (Supabase) — 10 minutes

This stores all the quotes your friends submit.

1. Go to **https://supabase.com** → Sign up free (use your Google account)
2. Click **"New Project"** → Name it `atly-birthday` → Choose any region → Create
3. Wait ~2 minutes for it to set up
4. In the left sidebar, click **"SQL Editor"**
5. Copy the entire contents of `SUPABASE_SETUP.sql` and paste it → click **"Run"**
6. Go to **Project Settings → API** (in the sidebar)
7. Copy two things:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string under "Project API keys")

Keep these — you'll need them in Step 2.

---

## STEP 2: Add your Supabase keys

1. In the project folder, create a file called **`.env`** (in the root, same level as `package.json`)
2. Add these two lines:

```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the values with what you copied from Supabase.

---

## STEP 3: Deploy to Vercel — 10 minutes

Vercel hosts it for free with a public URL.

1. Go to **https://github.com** → Create a free account if you don't have one
2. Create a new repository called `atly-birthday` → make it **public**
3. Upload all the project files (drag and drop the entire folder)
4. Go to **https://vercel.com** → Sign up with GitHub
5. Click **"New Project"** → Import your `atly-birthday` repo
6. Before deploying, click **"Environment Variables"** and add:
   - `REACT_APP_SUPABASE_URL` → your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` → your Supabase anon key
7. Click **"Deploy"**
8. In ~2 minutes you'll get a URL like `atly-birthday.vercel.app`

---

## STEP 4: Share with friends

Send your friends the link and tell them:
> "Atly turns 30 on June 15th. Go here and drop his most iconic quote. The game goes live on his birthday."

---

## STEP 5: On June 15th

Share the same link with Atly — the game automatically unlocks on that date. He'll play and dodge all the quotes his friends submitted! 🎮

---

## OPTIONAL: Custom domain

Vercel lets you use a custom domain for free. You could buy `atlyyesudas30.com` (~$12/year on Namecheap) and point it to Vercel. Totally optional but makes it extra special.

---

## How the game works

- Atly is a little lawyer-musician character navigating a randomly generated maze
- Quotes your friends submitted fly across the screen as obstacles
- He has 5 lives — each quote that hits him costs one
- He has to reach the 🏁 flag to win
- Mobile-friendly with on-screen D-pad
- Each playthrough generates a new maze

---

## Files in this project

```
atly-birthday/
├── public/
│   └── index.html          — main HTML shell
├── src/
│   ├── App.js              — main app with page routing
│   ├── App.css             — global styles
│   ├── index.js            — React entry point
│   ├── supabase.js         — database connection
│   └── pages/
│       ├── Landing.js/.css — birthday landing page
│       ├── Submit.js/.css  — quote submission + wall
│       └── Game.js/.css    — the escape maze game
├── package.json
├── .env                    — YOUR KEYS GO HERE (create this yourself)
└── SUPABASE_SETUP.sql      — run this in Supabase to create the database
```

---

Built with React, HTML5 Canvas, and Supabase. Hosted free on Vercel. Total cost: ₹0.
