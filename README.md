<div align="center">

💎 Finora AI

Manage Your Money Smarter with AI

An intelligent personal finance companion for tracking, understanding, and managing your financial life.

<br>









</div>

<div align="center">

💰 TRACK → 📊 UNDERSTAND → 🤖 ASK AI → 💡 GET INSIGHTS → 🎯 PLAN BETTER

</div>

🌌 What is Finora AI?

Finora AI is a modern AI-powered personal finance platform that brings financial organization, analytics, authentication, and AI assistance into one unified experience.

Instead of treating financial information as disconnected numbers, Finora AI is designed around a simple idea:

Make your money easier to understand.

Whether you're a student managing monthly expenses, an employee monitoring spending, a freelancer organizing finances, or simply someone who wants a clearer financial overview, Finora AI provides a centralized environment to explore your financial information.

🚀 Try Finora AI

<div align="center">

🌐 Live Production Application

✨ OPEN FINORA AI

https://finora-ai-tan.vercel.app/

<br>

🔐 Google Authentication Enabled
☁️ Production Deployed on Vercel
⚡ Connected to Supabase
🤖 Gemini AI Integration

</div>

✨ Why Finora AI?

🧠 Intelligence

📊 Visibility

🔐 Security

⚡ Experience

AI-assisted financial interaction

Financial dashboards & analytics

Supabase authentication

Modern responsive UI

Gemini-powered assistance

Visual summaries

OAuth support

Fast web experience

Natural-language questions

Spending insights

Environment-based secrets

Desktop & mobile friendly

💫 Core Features

💰 Smart Financial Management

Organize your financial information in one place.

Income information

Expense tracking

Financial summaries

Spending information

Personal finance overview

Centralized financial management

🤖 AI-Powered Financial Assistant

Interact with your financial information using an AI-assisted experience powered by Gemini.

Designed for:

Financial questions

Simplifying financial concepts

Understanding spending information

Generating useful insights

Natural-language interaction

AI responses are informational and should be independently verified before making important financial decisions.

📊 Intelligent Dashboard

A centralized dashboard brings important information together through:

Summary cards

Financial metrics

Charts

Spending information

Financial activity

Visual insights

🔐 Secure Authentication

Finora AI uses Supabase Authentication.

Supported authentication experience includes:

Account registration

Login

Google OAuth

Session management

Production authentication

Secure OAuth redirect handling

🎨 Modern Responsive Experience

The interface is designed around a clean, modern financial dashboard experience.

Responsive layout

Modern cards

Interactive components

Tailwind CSS styling

Desktop support

Tablet support

Mobile-friendly experience

🧠 Finora AI Experience

                   ┌─────────────────┐
                   │      USER       │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   FINORA AI     │
                   │   DASHBOARD     │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐  ┌───────────┐  ┌───────────┐
        │ FINANCE  │  │ ANALYTICS │  │  AI CHAT  │
        │   DATA   │  │ & CHARTS  │  │  GEMINI   │
        └────┬─────┘  └─────┬─────┘  └─────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                   ┌─────────────────┐
                   │    INSIGHTS     │
                   └────────┬────────┘
                            ▼
                   ┌─────────────────┐
                   │ BETTER FINANCE  │
                   │   MANAGEMENT    │
                   └─────────────────┘

🏗️ Technology Stack

<div align="center">

Layer

Technology

🎨 Frontend

React + TypeScript

⚡ Framework

TanStack Start

🧭 Routing

TanStack Router

🎨 Styling

Tailwind CSS

🧠 AI

Google Gemini

🔑 Authentication

Supabase Auth

☁️ Backend Services

Supabase

📡 Data Fetching

TanStack React Query

📈 Charts

Recharts

🛠️ Build Tool

Vite

🚀 Deployment

Vercel

📦 Package Manager

npm

</div>

🏛️ Architecture

                         ┌──────────────────────┐
                         │        USER          │
                         │ Browser / Mobile     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FINORA AI       │
                         │ React + TypeScript   │
                         │ Tailwind CSS         │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │  SUPABASE   │       │   GEMINI    │       │ APP LOGIC   │
       │             │       │     AI      │       │ & ANALYTICS │
       │ Auth        │       │             │       │             │
       │ Services    │       │ AI Assist   │       │ Dashboard   │
       └──────┬──────┘       └──────┬──────┘       └─────────────┘
              │                     │
              ▼                     ▼
       ┌─────────────┐       ┌─────────────┐
       │  Supabase   │       │ Google AI   │
       │  Services   │       │   Gemini    │
       └─────────────┘       └─────────────┘

                         ┌──────────────┐
                         │    VERCEL    │
                         │  PRODUCTION  │
                         └──────────────┘

📂 Project Structure

Finora-AI/
│
├── public/
│   └── ...                     # Static assets
│
├── src/
│   ├── components/
│   │   └── ...                 # Reusable UI components
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       └── ...             # Supabase integration & auth
│   │
│   ├── lib/
│   │   └── ...                 # Utilities & AI logic
│   │
│   ├── routes/
│   │   └── ...                 # Application routes
│   │
│   ├── styles.css              # Global styles
│   └── ...
│
├── supabase/
│   └── ...                     # Supabase configuration
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── capacitor.config.ts
└── README.md

🛠️ Getting Started

1️⃣ Clone the Repository

git clone https://github.com/sheema-sulthana/Finora-AI.git
cd Finora-AI

2️⃣ Install Dependencies

npm install

3️⃣ Configure Environment Variables

Create your local environment file from the example:

Windows PowerShell

Copy-Item .env.example .env

macOS / Linux

cp .env.example .env

Configure:

SUPABASE_PROJECT_ID=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=

VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=

GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_FALLBACK_MODEL=

🔒 Security Rules

Never commit .env.

Never commit:

API keys
OAuth secrets
Supabase service-role keys
Access tokens
Database passwords
Private credentials

▶️ Run Locally

Start the development server:

npm run dev

Then open the URL shown in your terminal.

🏭 Production Build

Build the application:

npm run build

Preview the production build:

npm run preview

🧹 Code Quality

Run ESLint:

npm run lint

Format the project:

npm run format

Recommended verification:

npm run lint
npm run build

🔐 Authentication

Finora AI uses Supabase Auth with Google OAuth.

Authentication Flow

        FINORA AI
            │
            ▼
      Supabase Auth
            │
            ▼
       Google OAuth
            │
            ▼
      Google Account
            │
            ▼
    Supabase Callback
            │
            ▼
      Finora AI App
            │
            ▼
         Dashboard

Production URL

https://finora-ai-tan.vercel.app

Production Redirect URL

https://finora-ai-tan.vercel.app/**

Local Redirect URL

http://localhost:8080/**

🤖 Gemini AI

Finora AI uses Google's Gemini AI through:

@google/genai

Configure:

GEMINI_API_KEY=your_api_key
GEMINI_MODEL=your_primary_model
GEMINI_FALLBACK_MODEL=your_fallback_model

Important

Keep your API key private.

If a credential is accidentally exposed:

Revoke the exposed credential.

Create a new credential.

Update your local .env.

Update Vercel Environment Variables.

Redeploy.

☁️ Deployment

Finora AI is deployed on Vercel.

Production



Live URL:
https://finora-ai-tan.vercel.app/

Deployment Pipeline

        CODE
         │
         ▼
   Local Development
         │
         ▼
    npm run build
         │
         ▼
      Git Commit
         │
         ▼
     GitHub main
         │
         ▼
       Vercel
         │
         ▼
   🚀 PRODUCTION

Push changes:

git add .
git commit -m "Update application"
git push origin main

🎯 Who is Finora AI For?

🎓 Students

Understand spending and manage everyday expenses.

💼 Employees

Keep track of income and personal spending.

💻 Freelancers

Maintain a clearer view of flexible financial activity.

🏠 Individuals & Families

Centralize financial information and understand spending patterns.

🤖 AI-Assisted Users

Ask finance-related questions using natural language.

💎 What Makes the Project Interesting?

01 — AI + Finance

Combines financial management with generative AI.

02 — Modern Full-Stack Architecture

Built using modern React and TanStack technologies with Supabase services.

03 — Real Authentication

Google OAuth and Supabase authentication are integrated into the production application.

04 — Production Deployed

The application is not only a local prototype — it is deployed and accessible through a live production URL.

05 — Designed for Expansion

The architecture can evolve toward deeper analytics, budgeting, financial goals, and personalized AI experiences.

🗺️ Roadmap

             NOW                         NEXT                       LATER

        ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
        │   Finora    │           │  Advanced   │           │  Financial  │
        │     AI      │ ────────► │  Analytics  │ ────────► │ Intelligence│
        └─────────────┘           └─────────────┘           └─────────────┘
              │                         │                         │
              ▼                         ▼                         ▼
        Authentication             Budgeting                Automation
        Dashboard                  Goals                    Predictions
        AI Assistant               Reports                  Personalization
        Analytics                  Insights                 Integrations

🧪 Development Workflow

┌─────────────────────────┐
│ 1. Develop Feature      │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 2. Test Locally         │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 3. Run Lint             │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 4. Run Production Build │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 5. Commit               │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 6. Push to GitHub       │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 7. Vercel Deployment    │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 8. Test Production      │
└─────────────────────────┘

🐛 Troubleshooting

Dependency Error

npm install

Then verify:

npm run build

Build Error

npm run build

Read the first actual error rather than only the final summary.

Environment Variable Error

Check:

.env exists locally.

Variable names match .env.example.

Development server was restarted.

Vercel environment variables are configured.

Secrets were not incorrectly prefixed with VITE_.

Google Login Error

Check:

Supabase → Authentication → URL Configuration

Production Site URL

Production Redirect URL

Local Redirect URL

Supabase Google provider

Google Client ID

Google Client Secret

Google OAuth callback URL

📊 Project Status

<div align="center">

🟢 LIVE & PRODUCTION READY

Component

Status

🌐 Web Application

🟢 Live

🚀 Vercel Deployment

🟢 Active

🔐 Supabase Authentication

🟢 Working

🔵 Google OAuth

🟢 Working

📊 Dashboard

🟢 Available

🤖 Gemini AI

🟢 Integrated

💻 GitHub Repository

🟢 Active

</div>

🌐 Important Links

<div align="center">

🚀 Live Demo

OPEN FINORA AI →

💻 GitHub

VIEW SOURCE CODE →

</div>

👨‍💻 Author

Kamil Ahamed SK

B.Tech — Computer Science & Engineering (Artificial Intelligence)

Finora AI is developed as an AI-focused financial technology project combining:

React · TypeScript · TanStack Start · Supabase · Gemini AI · Tailwind CSS · Vercel

⭐ Support the Project

If you find Finora AI interesting:

⭐ Star the repository
🍴 Fork the project
🐛 Report bugs
💡 Suggest improvements
🔧 Contribute features
📢 Share the project

⚠️ Disclaimer

Finora AI is an AI-assisted financial management application intended for informational and organizational purposes.

AI-generated information may be incomplete or incorrect. Important financial information should be independently verified, and users should consult qualified financial professionals when appropriate.

Finora AI does not replace professional financial, investment, tax, legal, or accounting advice.

<div align="center">

💎 Finora AI

Manage Your Money Smarter with AI.

<br>

🚀 Live Demo • 💻 GitHub

<br>

Built with ❤️ using React, TypeScript, TanStack, Supabase, Gemini AI & Vercel

</div>
