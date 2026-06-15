# GitHub Value Hub

A modern full-stack application built with **TanStack Start** to provide insights and value analysis for GitHub repositories and developers.

**[🚀 Live Demo](https://github-value-hub.vercel.app)**

---

## ✨ Features

- 📊 **Repository Analytics** — Deep insights into GitHub repositories
- 🔍 **Advanced Search** — Find valuable projects and developers
- 💾 **Data Persistence** — Seamless data storage and management
- 🎨 **Modern UI** — Beautiful, accessible interface built with Radix UI & Tailwind CSS
- ⚡ **High Performance** — Optimized with React Query and Vite
- 📱 **Responsive Design** — Works great on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

- **Frontend Framework**: [TanStack Start](https://tanstack.com/start) + React 19
- **State Management**: [TanStack React Query](https://tanstack.com/query)
- **Routing**: [TanStack React Router](https://tanstack.com/router)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript

### Additional Libraries

- 📅 **date-fns** — Date utilities
- 📊 **Recharts** — Data visualization
- 🖼️ **html-to-image** — Screenshot generation
- 📄 **jsPDF** — PDF export
- 🎯 **cmdk** — Command palette UI
- 🪟 **react-resizable-panels** — Resizable layouts
- 🎪 **embla-carousel** — Carousel component

---

## 📋 Project Structure

```
src/
├── routes/          # File-based routing (TanStack Start)
├── components/      # Reusable React components
├── lib/             # Utilities and helpers
├── styles/          # Global CSS
└── api/             # Server-side endpoints (optional)
```

### Routing Convention

Uses **file-based routing**. Key conventions:
- `index.tsx` → `/`
- `about.tsx` → `/about`
- `users/$id.tsx` → `/users/:id` (dynamic)
- `__root.tsx` → App shell (wraps all routes)

See `src/routes/README.md` for full routing documentation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Aldtor/github-value-hub.git
cd github-value-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Build for production with Vercel output verification |
| `npm run build:dev` | Build in development mode for debugging |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm run format` | Format code with Prettier |

---

## 🎯 Key Features to Explore

### 1. Modern Data Fetching
Leverages **TanStack React Query** for robust data management, caching, and synchronization.

### 2. Type-Safe Forms
Fully typed forms with **React Hook Form** and **Zod** schema validation.

### 3. Accessible Components
All UI components built on **Radix UI** primitives ensure WCAG compliance and keyboard navigation.

### 4. Responsive Layouts
**Tailwind CSS** provides utility-first styling with built-in responsive design utilities.

---

## 🌐 Deployment

This project is optimized for **Vercel** deployment:

```bash
npm run build  # Includes Vercel output verification
```

### Environment Variables

Add any required environment variables to `.env.local`:

```env
# Example
VITE_API_URL=https://api.example.com
```

---

## 📖 Documentation

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [React Router Docs](https://tanstack.com/router/latest)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---

## 📄 License

This project is currently unlicensed. See the LICENSE file for details.

---

## 👨‍💻 Author

Created by [@Aldtor](https://github.com/Aldtor)

---

**Made with ❤️ for the GitHub community**
