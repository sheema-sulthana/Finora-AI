\# 💰 Finora AI – Intelligent Personal Finance Platform

\## 📖 Overview

Finora AI is an AI-powered personal finance platform designed to help users understand, manage, and improve their financial habits.

The platform combines intelligent financial analysis, expense tracking, budgeting, data visualization, and AI-powered financial guidance into a single modern application.

Finora AI allows users to securely manage their financial information, analyze spending patterns, monitor income and expenses, and receive personalized insights using Google Gemini AI.

The platform is designed for students, professionals, freelancers, families, and anyone who wants to make smarter financial decisions.

\---

\# 🚀 Live Demo

🌐 \*\*Live Application:\*\* &#x20;
[https://finora-ai-tan.vercel.app/](https://finora-ai-tan.vercel.app/)

💻 \*\*GitHub Repository:\*\* &#x20;
https://github.com/sheema-sulthana/Finora-AI

\---

\# ✨ Features

\### 🔐 Authentication

\- User Registration
\- Secure Login
\- Logout
\- Session Management
\- Google OAuth Login
\- Supabase Authentication
\- Protected application routes

\---

\### 🤖 AI Financial Assistant

Finora AI uses Google Gemini AI to provide intelligent financial assistance.

Features include:

\- AI-powered financial conversations
\- Personalized financial insights
\- Spending analysis
\- Budget suggestions
\- Saving recommendations
\- Financial habit analysis
\- Natural-language financial guidance

\---

\### 📊 Financial Dashboard

The dashboard provides a centralized overview of the user's financial activity.

Includes:

\- Total Balance
\- Income Overview
\- Expense Overview
\- Savings
\- Budget Progress
\- Financial Health Information
\- Recent Transactions
\- Spending Analytics

\---

\### 💰 Income & Expense Tracking

Users can manage their financial transactions and understand where their money is going.

Features include:

\- Add income
\- Add expenses
\- Categorize transactions
\- Track spending
\- View transaction history
\- Monitor financial activity

\---

\### 📈 Financial Analytics

Finora AI provides visual representations of financial data.

Includes:

\- Expense charts
\- Income charts
\- Spending trends
\- Category-based analysis
\- Monthly financial summaries
\- Savings analysis
\- Interactive data visualization

\---

\### 🧠 Smart Financial Insights

The platform analyzes financial information and provides meaningful insights such as:

\- Spending patterns
\- High-expense categories
\- Saving opportunities
\- Budget performance
\- Monthly financial trends
\- Personalized recommendations

\---

\### 📄 Financial Data Upload

Finora AI supports financial data processing workflows for:

\- Bank statements
\- CSV files
\- Receipt images
\- Screenshots
\- Financial documents

Uploaded information can be processed and analyzed to help organize financial activity.

\---

\### 💬 AI Financial Coach

The AI Financial Coach provides a conversational interface where users can ask questions about their finances.

Example questions:

\- "How can I reduce my monthly expenses?"
\- "Where am I spending the most?"
\- "How much should I save every month?"
\- "How can I improve my budget?"
\- "What are my biggest spending categories?"

\---

\### 📱 Responsive Design

Finora AI is designed to work across different screen sizes.

Supported layouts include:

\- Desktop
\- Laptop
\- Tablet
\- Mobile

The interface uses a modern fintech-inspired design with responsive components and smooth interactions.

\---

\### 🎨 Modern UI / UX

The application includes:

\- Premium dark theme
\- Glassmorphism
\- Gradient effects
\- Animated interfaces
\- Interactive cards
\- Smooth transitions
\- Responsive navigation
\- Modern typography
\- Financial dashboard components

\---

\# 🛠 Technology Stack

\## Frontend

\- React
\- TypeScript
\- TanStack Start
\- TanStack Router
\- Tailwind CSS
\- Vite
\- HTML5
\- CSS3
\- JavaScript

\---

\## AI

\- Google Gemini AI
\- \`@google/genai\`

Gemini AI is used for intelligent financial assistance, financial analysis, and personalized recommendations.

\---

\## Backend & Data

\- Supabase
\- Supabase Database
\- Supabase Authentication
\- Supabase JavaScript Client

\---

\## Authentication

\- Supabase Auth
\- Google OAuth 2.0
\- Session-based authentication

\---

\## Data Visualization

\- Recharts
\- Interactive charts
\- Financial analytics
\- Spending visualizations

\---

\## State & Data Management

\- TanStack React Query
\- React Hooks
\- Application state management

\---

\## Styling

\- Tailwind CSS
\- Custom CSS
\- Glassmorphism UI
\- Responsive layouts
\- Animated components

\---

\## Development Tools

\- Node.js
\- npm
\- Vite
\- ESLint
\- Prettier
\- TypeScript

\---

\## Deployment

\- Vercel
\- GitHub

\---

\# 📂 Project Structure

\`\`\`text
Finora-AI/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── assets/
│
├── src/
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── ...
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── lib/
│   │   ├── AI utilities
│   │   ├── financial utilities
│   │   └── application helpers
│   │
│   ├── routes/
│   │   ├── login
│   │   ├── signup
│   │   ├── dashboard
│   │   └── application routes
│   │
│   ├── styles.css
│   └── ...
│
├── supabase/
│   └── database configuration
│
├── .lovable/
│
├── .env.example
├── .gitignore
├── AGENTS.md
├── components.json
├── eslint.config.js
├── package.json
├── package-lock.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
└── README.md 
---

# ⚙️ Getting Started

Follow the steps below to run Finora AI locally.

## 📋 Prerequisites

Make sure the following tools are installed on your system:

* Node.js 18+
* npm
* Git
* A Supabase account
* A Google AI Studio / Gemini API key

Check your installed versions:

```bash
node --version
npm --version
git --version
```

---

# 📥 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/sheema-sulthana/Finora-AI.git
```

Navigate into the project directory:

```bash
cd Finora-AI
```

---

## 2. Install Dependencies

Install all required packages:

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the root directory of the project.

You can use the provided `.env.example` file as a reference:

```bash
cp .env.example .env
```

Then configure the required environment variables.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit your `.env` file or expose private API keys in the repository.

---

# 🗄️ Supabase Configuration

Finora AI uses Supabase for authentication and application data.

## Create a Supabase Project

1. Create a project in Supabase.
2. Copy the project URL.
3. Copy the required public/anonymous API key.
4. Add the credentials to your `.env` file.
5. Configure authentication providers if required.
6. Apply the required database configuration.

The Supabase integration is located under:

```text
src/
└── integrations/
    └── supabase/
```

---

# 🤖 Gemini AI Configuration

Finora AI uses Google's Gemini AI capabilities for AI-powered financial assistance and analysis.

## API Key Setup

1. Create or obtain a Gemini API key.
2. Add the key to your local environment configuration.
3. Restart the development server after updating environment variables.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

> 🔒 Keep API keys private and never commit them to GitHub.

---

# ▶️ Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at the local development URL shown in your terminal.

For example:

```text
http://localhost:5173
```

---

# 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 🧪 Code Quality

Run the project's linting checks:

```bash
npm run lint
```

Before submitting changes, make sure the project builds successfully and does not contain linting errors.

---

# 🔄 Application Workflow

The general Finora AI workflow can be represented as:

```text
                    ┌───────────────────┐
                    │      User         │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Authentication    │
                    │ Supabase Auth     │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Financial Data    │
                    │ Transactions      │
                    │ Income / Expenses │
                    └─────────┬─────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
       ┌─────────────────┐        ┌─────────────────┐
       │ Financial       │        │ Gemini AI       │
       │ Analytics       │        │ Analysis        │
       └────────┬────────┘        └────────┬────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Personalized      │
                    │ Financial Insights│
                    └───────────────────┘
```

---

# 🧩 Application Architecture

Finora AI follows a modern frontend architecture where different parts of the application are separated based on their responsibilities.

```text
┌─────────────────────────────────────────────┐
│                 User Interface              │
│          React + TypeScript + UI            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              Application Layer              │
│       Routes + Components + Hooks           │
└──────────────────────┬──────────────────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
┌─────────────────────┐  ┌─────────────────────┐
│   Supabase Layer    │  │     AI Layer        │
│                     │  │                     │
│ Authentication      │  │ Google Gemini      │
│ Database            │  │ AI Analysis        │
│ User Data           │  │ AI Assistance      │
└─────────────────────┘  └─────────────────────┘
             │                   │
             └─────────┬─────────┘
                       ▼
              ┌─────────────────┐
              │ Financial       │
              │ Insights        │
              │ & Analytics     │
              └─────────────────┘
```

---

# 📊 Core Financial Modules

Finora AI is organized around several major financial management areas.

## 💵 Income Management

Users can record and monitor income sources to understand their available financial resources.

## 💸 Expense Management

Users can record expenses and organize financial activity into meaningful categories.

## 📊 Analytics

Financial information can be represented through charts and visual analytics to make spending patterns easier to understand.

## 🎯 Budget Monitoring

Budget-related information can be used to understand spending performance and financial progress.

## 🤖 AI Assistance

The AI layer provides a conversational interface for asking financial questions and obtaining personalized insights based on available financial information.

---

# 🖥️ User Interface

Finora AI focuses on providing a modern and accessible financial management experience.

### Main UI principles

* Clean financial dashboard
* Responsive layouts
* Reusable components
* Consistent typography
* Interactive data visualization
* Dark-themed fintech interface
* Clear financial information hierarchy
* Mobile-friendly design

---

# 📸 Screenshots

Screenshots of the application can be added here to showcase the main user experience.

## Landing Page

> Add your Finora AI landing-page screenshot here.

```text
screenshots/
└── landing-page.png
```

## Dashboard

> Add your financial dashboard screenshot here.

## AI Financial Assistant

> Add your AI assistant screenshot here.

## Analytics

> Add your financial analytics screenshot here.

### Recommended GitHub image format

Once screenshots are added to the repository, you can display them using:

```markdown
![Finora AI Dashboard](./screenshots/dashboard.png)
```

---

# 🌐 Live Demo

Try the deployed application:

**Live Application:**
https://finora-ai-tan.vercel.app/

**Source Code:**
https://github.com/sheema-sulthana/Finora-AI

---

# 🔐 Security & Privacy

Finora AI is designed with security and privacy considerations in mind.

### Security practices

* Authentication is handled through Supabase.
* Sensitive environment variables are stored outside the source code.
* API keys should not be committed to GitHub.
* User-specific data should be protected through appropriate authentication and database access policies.
* `.env` files are excluded from version control.

### Important

Finora AI is a software project intended for financial organization and educational purposes.

It does **not** replace professional financial, investment, tax, or legal advice.

Users should independently verify important financial decisions.

---

# ⚠️ Limitations

Finora AI is an evolving project and may have limitations depending on the current implementation.

Potential limitations include:

* AI-generated financial suggestions may not always be accurate.
* Financial analysis depends on the quality of the data provided by the user.
* External AI services may require an active API key.
* Supabase services require appropriate project configuration.
* Uploaded financial documents may require additional processing depending on their format and structure.
* The application should not be treated as a replacement for professional financial advice.

---

# 🚧 Future Improvements

The following features can be considered for future versions of Finora AI:

### 📱 Mobile Application

Develop dedicated Android and iOS applications for easier access.

### 🏦 Financial Account Integration

Integrate supported financial data providers to reduce manual transaction entry.

### 💳 Payment History Import

Support importing transaction histories from supported payment and banking platforms where technically and legally appropriate.

### 🧾 Advanced Receipt Processing

Improve receipt and financial-document processing using OCR and AI.

### 🔔 Smart Notifications

Introduce notifications for:

* Budget limits
* Unusual spending
* Upcoming payments
* Saving goals
* Subscription renewals

### 🎯 Financial Goals

Allow users to create and track goals such as:

* Emergency funds
* Education
* Travel
* Major purchases
* Monthly savings targets

### 📈 Advanced AI Analytics

Expand AI capabilities to identify:

* Spending trends
* Recurring expenses
* Potential savings opportunities
* Budget deviations
* Financial behavior patterns

### 🌍 Multi-Language Support

Add support for multiple languages to make the platform accessible to a wider audience.

---

# 🗺️ Roadmap

```text
[x] Authentication
[x] Financial dashboard
[x] Income and expense tracking
[x] Financial analytics
[x] AI financial assistance
[x] Responsive interface

[ ] Advanced financial goals
[ ] Smart notifications
[ ] Advanced receipt/OCR processing
[ ] More financial integrations
[ ] Mobile application
[ ] Multi-language support
```

> The roadmap may change as the project evolves.

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

## Fork the Repository

Create your own fork of the project.

## Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/Finora-AI.git
```

## Create a Branch

```bash
git checkout -b feature/your-feature
```

## Make Your Changes

Implement your feature or improvement and test it locally.

## Commit Your Changes

```bash
git add .
git commit -m "Add: your feature"
```

## Push Your Branch

```bash
git push origin feature/your-feature
```

Then open a Pull Request on GitHub.

---

# 🐛 Reporting Issues

If you find a bug or have a feature suggestion, open an issue in the GitHub repository.

When reporting an issue, include:

* Description of the problem
* Steps to reproduce it
* Expected behavior
* Actual behavior
* Screenshots or error messages
* Browser/environment information when relevant

---

# 📄 License

This project is currently available for educational and development purposes.

If you intend to publish Finora AI as an open-source project, add an appropriate license such as MIT and include the corresponding `LICENSE` file in the repository.

---

# 👩‍💻 Author

### Sheema Sulthana

BTech Student | Artificial Intelligence

**GitHub:**
https://github.com/sheema-sulthana

---

# ⭐ Support the Project

If you find Finora AI useful or interesting:

⭐ Star the repository
🍴 Fork the project
🐛 Report issues
💡 Suggest improvements
🤝 Contribute to the project

---

# 💡 Project Vision

> **"Making personal finance simpler, smarter, and more understandable through AI."**

Finora AI aims to bring financial tracking, analytics, and intelligent assistance together in one accessible platform.

---

## 🔗 Project Links

| Resource             | Link                                         |
| -------------------- | -------------------------------------------- |
| 🌐 Live Application  | https://finora-ai-tan.vercel.app/            |
| 💻 GitHub Repository | https://github.com/sheema-sulthana/Finora-AI |
| 👩‍💻 Developer      | https://github.com/sheema-sulthana           |

---

<p align="center">
  Made with ❤️ using React, TypeScript, Supabase & Google Gemini AI
</p>
