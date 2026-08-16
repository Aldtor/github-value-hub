# 📊 GitWorth (github-value-hub)

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gittworth.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://gittworth.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub API](https://img.shields.io/badge/API-GitHub%20REST-181717?style=for-the-badge&logo=github&logoColor=white)](https://docs.github.com/en/rest)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

### **Developer Profile Scoring, Head-to-Head Comparisons, Wrapped Graphics & Badge Engine**

*Evaluate real GitHub output beyond simple green contribution squares. Calculate weighted developer scores, compare engineering stats head-to-head, generate dynamic README badges, and render shareable annual GitHub Wrapped posters.*

---

[Live Application](https://gittworth.vercel.app/) • [Features](#-key-features) • [Scoring Algorithm](#-scoring-engine--metrics) • [Architecture](#-tech-stack--architecture) • [Getting Started](#-getting-started)

</div>

---

## 📌 Overview

GitHub profile commit heatmaps are easily skewed by trivial automated commits, bots, and empty repositories. **GitWorth** provides a holistic, multi-dimensional appraisal of a developer's real engineering impact.

By interfacing with the **GitHub REST API**, GitWorth evaluates repository complexity, stars, original code contributions, language breadth, pull requests, and commit velocity to compute a verifiable **GitWorth Score**, percentile tier, embeddable badges, and year-in-review summaries.

---

## ✨ Key Features

- 🏆 **GitWorth Score Engine:** Multi-factor algorithmic scoring that weights stars, forks, original non-forked repos, language diversity, and contribution consistency.
- ⚔️ **Head-to-Head Comparison (`/compare/:user1/:user2`):** Stat-by-stat engineering matchup comparing two developers side-by-side.
- 🥇 **Developer Leaderboard (`/leaderboard`):** Global community rankings categorized by score tiers (Grandmaster, Master, Diamond, Emerald).
- 🏷️ **Embeddable Profile Badges (`/badges/:username`):** Dynamic SVG and PNG score badges for personal portfolio sites and GitHub profile READMEs.
- 🎁 **GitHub Wrapped Posters (`/wrapped/:username`):** Visually stunning, shareable summary cards rendered client-side using `html-to-image`.
- 📁 **Instant Portfolio View (`/portfolio/:username`):** Automatically converts public GitHub repository history into a clean showcase page.
- ⚡ **Rate-Limit Resilient Architecture:** Optimized caching layers and debounced API consumers for unauthenticated and authenticated queries.

---

## 🧮 Scoring Engine & Metrics

```
GitWorth Weighted Score Calculation
├── Repository Impact (35%)
│   ├── Original Non-Forked Repos
│   ├── Stargazer Count & Star-to-Repo Ratio
│   └── Fork Count & Ecosystem Reuse
├── Code Velocity & Consistency (30%)
│   ├── Public Commit Volume & Frequency
│   └── Contribution Longevity & Active Weeks
├── Technical Breadth (20%)
│   ├── Multi-Language Diversity Index
│   └── Framework & Tooling Spectrum
└── Community & Collaboration (15%)
    ├── Pull Requests Opened & Merged
    └── Issues Resolved & Discussions
```

---

## 🛠️ Tech Stack & Architecture

- **Full-Stack Framework:** TanStack Start (`@tanstack/react-start`) + TanStack Router
- **UI & State:** React 19.2 + TypeScript + TanStack Query (`@tanstack/react-query`)
- **Styling:** Tailwind CSS v4 + Radix UI Primitives (`@radix-ui/react-*`) + Lucide React
- **Graphics & Export:** `html-to-image` for high-res social cards + `jspdf` for report generation
- **API:** GitHub REST API v3

---

## 📁 Project Structure

```
github-value-hub/
├── src/
│   ├── routes/
│   │   ├── __root.tsx                    # Root layout & global navigation
│   │   ├── index.tsx                     # Landing page & username score lookup
│   │   ├── compare.tsx                   # Head-to-head comparison search
│   │   ├── compare_.$user1.$user2.tsx    # Live comparison view
│   │   ├── leaderboard.tsx               # Top developer rankings
│   │   ├── badges.$username.tsx          # Dynamic SVG badge generator
│   │   ├── wrapped.$username.tsx         # Annual GitHub Wrapped generator
│   │   └── portfolio.$username.tsx       # Auto-generated portfolio showcase
│   ├── components/                       # Radar charts, score bars, stat cards, UI
│   ├── lib/                              # GitHub API clients, scoring formulas, caching
│   └── ...
├── public/
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- (Optional) GitHub Personal Access Token (`GITHUB_TOKEN`) to increase rate limits

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aldtor/github-value-hub.git
   cd github-value-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 👤 Author

**Satyam Kumar (Aldtor)**
- 🌐 Portfolio: [aldtor.vercel.app](https://aldtor.vercel.app)
- 🐙 GitHub: [@Aldtor](https://github.com/Aldtor)
- 💼 LinkedIn: [linkedin.com/in/aldtor](https://in.linkedin.com/in/aldtor)

---

<div align="center">
  <sub>Built with ❤️ for developers who build, ship, and contribute to open source.</sub>
</div>
