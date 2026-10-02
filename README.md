# 💰 Finora AI – Intelligent Personal Finance Platform

## 📖 Overview

Finora AI is an AI-powered personal finance platform designed to help users understand, manage, and improve their financial habits.

The platform combines financial tracking, expense management, data visualization, AI-powered financial assistance, and personalized insights into a single modern application.

Finora AI helps users monitor their income and expenses, understand spending patterns, visualize their financial activity, and interact with an AI financial assistant for personalized guidance.

The platform is designed for students, professionals, freelancers, families, and anyone who wants to better understand and manage their personal finances.

---

# 🚀 Live Demo

🌐 **Live Application:**
https://finora-ai-tan.vercel.app/

💻 **GitHub Repository:**
https://github.com/sheema-sulthana/Finora-AI

---

# ✨ Features

### 🔐 Authentication

* User Registration
* Secure Login
* Logout
* Session Management
* Supabase Authentication
* Google OAuth support
* Protected application access

---

### 📊 Financial Dashboard

The Finora AI dashboard provides a centralized overview of the user's financial activity.

Includes:

* Total Balance
* Income Overview
* Expense Overview
* Savings Overview
* Budget Information
* Recent Transactions
* Financial Analytics
* Spending Overview

---

### 💰 Income & Expense Tracking

Users can manage their financial transactions and monitor their spending.

Features include:

* Add income
* Add expenses
* Categorize transactions
* View transaction history
* Monitor spending
* Track financial activity

---

### 📈 Financial Analytics

Finora AI transforms financial information into visual insights.

Includes:

* Expense charts
* Income charts
* Spending trends
* Category-based analysis
* Monthly summaries
* Savings analysis
* Interactive visualizations

---

### 🤖 AI Financial Assistant

Finora AI integrates Google Gemini AI to provide intelligent financial assistance.

Users can interact with the AI assistant to receive guidance related to their financial activity.

Capabilities include:

* AI-powered financial conversations
* Spending analysis
* Personalized financial insights
* Budget suggestions
* Saving recommendations
* Financial habit analysis
* Natural-language financial guidance

Example questions:

* "Where am I spending the most?"
* "How can I reduce my monthly expenses?"
* "How much should I save every month?"
* "How can I improve my budget?"
* "What are my biggest spending categories?"

---

### 🧠 Smart Financial Insights

Finora AI analyzes available financial information to help users understand their financial behavior.

Insights can include:

* Spending patterns
* High-expense categories
* Saving opportunities
* Budget performance
* Monthly financial trends
* Personalized recommendations

---

### 📄 Financial Data Processing

The platform is designed to support financial data processing workflows.

Supported data sources can include:

* Bank statements
* CSV files
* Receipt images
* Screenshots
* Financial documents

Financial information can then be organized and analyzed within the platform.

---

### 📱 Responsive Design

Finora AI is designed to provide a consistent experience across different screen sizes.

Supported layouts include:

* Desktop
* Laptop
* Tablet
* Mobile

---

### 🎨 Modern UI / UX

The application uses a modern fintech-inspired interface featuring:

* Premium dark theme
* Glassmorphism
* Gradient effects
* Interactive cards
* Smooth transitions
* Responsive navigation
* Modern typography
* Financial dashboard components

---

# 🛠 Technology Stack

## Frontend

* React
* TypeScript
* TanStack Start
* TanStack Router
* Tailwind CSS
* Vite
* HTML5
* CSS3

---

## AI

* Google Gemini AI
* `@google/genai`

Gemini AI is used for AI-powered financial assistance, analysis, and personalized financial guidance.

---

## Backend & Database

* Supabase
* Supabase Database
* Supabase JavaScript Client

Supabase provides the application's backend services and data infrastructure.

---

## Authentication

* Supabase Auth
* Google OAuth 2.0
* Session Management

---

## Data Visualization

* Recharts
* Interactive charts
* Financial analytics
* Spending visualizations

---

## State & Data Management

* TanStack React Query
* React Hooks

---

## Styling

* Tailwind CSS
* Custom CSS
* Glassmorphism UI
* Responsive layouts
* Animated components

---

## Development Tools

* Node.js
* npm
* TypeScript
* Vite
* ESLint
* Prettier

---

## Deployment

* Vercel
* GitHub

---

# 📂 Project Structure

```text
Finora-AI/
│
├── .lovable/
│
├── public/
│   └── assets/
│
├── src/
│   │
│   ├── components/
│   │   └── ui/
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── lib/
│   │
│   ├── routes/
│   │
│   ├── styles.css
│   └── ...
│
├── supabase/
│   └── ...
│
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── AGENTS.md
├── components.json
├── eslint.config.js
├── package.json
├── package-lock.json
├── bun.lock
├── bunfig.toml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/sheema-sulthana/Finora-AI.git
```

---

## Enter Project

```bash
cd Finora-AI
```

---

## Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

## Run Project

Start the development server:

```bash
npm run dev
```

Or:

```bash
bun run dev
```

The application will be available at the local development URL shown in the terminal.

Usually:

```text
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory of the project.

You can use `.env.example` as a reference.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Environment Variable Description

| Variable                 | Purpose                       |
| ------------------------ | ----------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL          |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anonymous key |
| `GEMINI_API_KEY`         | Google Gemini AI API key      |

> ⚠️ Never commit your `.env` file or expose private API keys in the repository.

---

# 🗄️ Supabase Setup

Finora AI uses Supabase for authentication and application data.

### Setup Steps

1. Create a Supabase project.
2. Copy your Supabase project URL.
3. Copy the required Supabase API key.
4. Add the credentials to your `.env` file.
5. Configure authentication providers.
6. Configure the required database tables and policies.
7. Start the application.

The Supabase integration is located inside:

```text
src/
└── integrations/
    └── supabase/
```

---

# 🤖 Gemini AI Setup

Finora AI uses Google Gemini AI for its AI-powered financial assistance.

### Setup Steps

1. Obtain a Gemini API key.
2. Add the key to your environment configuration.
3. Restart the development server.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

> 🔒 Keep your API key private and never upload it to GitHub.

---

# 🏗️ Build for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 📈 Project Highlights

✔ AI-Powered Financial Assistant
✔ Personal Finance Dashboard
✔ Income & Expense Tracking
✔ Financial Analytics
✔ Spending Visualization
✔ Personalized Financial Insights
✔ Supabase Authentication
✔ Google OAuth Support
✔ Responsive Design
✔ Modern Fintech UI
✔ Google Gemini AI Integration
✔ Recharts Data Visualization
✔ React + TypeScript Architecture
✔ Vercel Deployment

---

# 🔮 Future Improvements

The project can be further expanded with:

* 📱 Dedicated Android and iOS applications
* 🏦 Bank account integrations
* 💳 Payment history import
* 🧾 Advanced receipt OCR
* 🔔 Smart financial notifications
* 🎯 Financial goal tracking
* 📊 Advanced spending predictions
* 🌍 Multi-language support
* 🔄 Automatic recurring-expense detection
* 📈 Advanced AI financial forecasting

---

# 🔗 Project Links

🌐 **Live Application**
https://finora-ai-tan.vercel.app/

💻 **GitHub Repository**
https://github.com/sheema-sulthana/Finora-AI

👩‍💻 **Developer GitHub**
https://github.com/sheema-sulthana

---

# 👩‍💻 Author

** Shaik Sheema Sulthana**

BTech – Artificial Intelligence

GitHub:
https://github.com/sheema-sulthana

---

# 📜 License

This project is developed for educational, learning, and software development purposes.

Feel free to explore the project and use it as a reference for learning and development.

---

⭐ If you like this project, don't forget to **star the repository**!
