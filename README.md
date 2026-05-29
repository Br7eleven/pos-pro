# POS Pro

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-69.7%25-3178c6.svg)
![CSS](https://img.shields.io/badge/CSS-29.9%25-1572b6.svg)
![Maintained](https://img.shields.io/badge/Maintained%3F-yes-success.svg)

**The ultimate offline-first desktop Point-of-Sale solution for retail shops.**

</div>

[Features](#features) • [Quick Start](#quick-start) • [Installation](#installation) • [Development](#development) • [Architecture](#architecture) • [Contributing](#contributing)

---

## 📋 Overview

**POS Pro** is a modern, lightweight desktop Point-of-Sale (POS) application designed specifically for retail shops operating offline. Built with industry-standard technologies, POS Pro delivers fast,[...]

All customer data, transactions, inventory, and sales history are stored securely on the local machine using SQLite, ensuring complete data privacy and instant access. Whether you're managing a small [...]

### Key Highlights

- ✅ **Offline-First Architecture** — Works anywhere, anytime, no internet required
- ✅ **Cross-Platform** — Native support for Windows and macOS
- ✅ **Local Data Storage** — SQLite database on your machine, complete data ownership
- ✅ **Fast & Responsive** — Optimized UI for rapid transaction processing
- ✅ **Secure** — Built-in authentication with bcrypt password hashing
- ✅ **Modern Stack** — React, TypeScript, Electron, and Zustand state management

---

## 🎯 Features

### Core POS Functionality
- **Product Management** — Add, update, and organize products with categories and pricing
- **Sales Transactions** — Fast checkout process with barcode scanning support
- **Payment Processing** — Multiple payment methods (Cash, Card, Check)
- **Receipt Generation** — Professional printed or digital receipts
- **Sales History** — Complete transaction audit trail with timestamps and user tracking

### Business Intelligence
- **Real-Time Reporting** — Sales dashboards with charts and analytics
- **Inventory Tracking** — Stock level monitoring and low-stock alerts
- **Daily/Weekly/Monthly Reports** — Comprehensive sales and revenue reports
- **User Analytics** — Track employee performance and transactions

### Security & Administration
- **User Authentication** — Multi-user support with role-based access
- **Password Protection** — Bcrypt-hashed credentials
- **Admin Dashboard** — User and system configuration management
- **Data Backup** — Local SQLite database exports

### User Experience
- **Intuitive UI** — Designed for retail environments with minimal training
- **Quick Mode** — Fast transaction entry for high-volume retailers
- **Customizable Settings** — Tailor the application to your business needs
- **Dark Mode Support** — Reduce eye strain during long shifts

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.0 or higher
- **npm** v8.0 or higher
- **Windows** 10+ or **macOS** 10.15+

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Br7eleven/pos-pro.git
   cd pos-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The application will open automatically on `http://localhost:5173`

### Building for Production

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for all platforms
npm run build
```

The packaged application will be available in the `dist/` directory.

---

## 📦 Installation

### For End Users

1. Download the latest release from [Releases](https://github.com/Br7eleven/pos-pro/releases)
2. Run the installer (`pos-pro-setup.exe` for Windows or `.dmg` for macOS)
3. Follow the installation wizard
4. Launch POS Pro from your Applications menu
5. Create your admin account on first launch

### System Requirements

| Requirement | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 / macOS 10.15 | Windows 11 / macOS 12+ |
| RAM | 4 GB | 8 GB+ |
| Storage | 500 MB | 1 GB+ |
| Screen Resolution | 1024x768 | 1920x1080+ |

---

## 💻 Development

### Project Structure

```
pos-pro/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts        # Entry point
│   │   └── preload.ts      # Preload scripts
│   ├── renderer/           # React frontend
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand state management
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # Global CSS
│   │   └── App.tsx         # Root component
│   └── shared/             # Shared types and utilities
├── public/                 # Static assets
├── electron.vite.config.ts # Electron Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Runtime** | Electron 29.3.1 | Cross-platform desktop application |
| **Frontend Framework** | React 18.3.1 | UI components and state management |
| **Language** | TypeScript 5.4.5 | Type-safe development |
| **State Management** | Zustand 4.5.2 | Lightweight global state |
| **Database** | SQLite 3 (better-sqlite3) | Local data persistence |
| **Routing** | React Router 6.22.3 | Client-side navigation |
| **Forms** | React Hook Form 7.51.3 | Form state and validation |
| **Validation** | Zod 3.22.4 | Schema validation |
| **Charting** | Recharts 2.12.4 | Data visualization |
| **Icons** | Lucide React 0.376.0 | Icon library |
| **Styling** | CSS | Custom styles (29.9% of codebase) |
| **Build Tool** | Vite 2.1.0 | Fast module bundler |
| **Testing** | Vitest 1.6.0 | Unit testing framework |
| **Linting** | ESLint 8.57.0 | Code quality |

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run preview          # Preview production build

# Building
npm run build            # Build for current platform
npm run build:win        # Build Windows installer

# Code Quality
npm run lint             # Run ESLint on TypeScript files

# Testing
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes**
   ```bash
   npm run lint
   npm test
   npm run dev
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature description"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Coding Standards

- **Language**: TypeScript with strict mode enabled
- **Code Style**: ESLint + Prettier (configured)
- **Components**: Functional React components with hooks
- **State Management**: Zustand stores for global state
- **Testing**: Unit tests with Vitest
- **Commits**: Follow Conventional Commits specification

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│        Electron Main Process            │
│  (Window Management, IPC, File System)  │
├─────────────────────────────────────────┤
│       IPC Bridge (Secure)               │
├─────────────────────────────────────────┤
│      React Renderer Process             │
│  (UI, State Management, Business Logic) │
├─────────────────────────────────────────┤
│          SQLite Database                │
│  (Local Data Persistence)               │
└─────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → React Component
2. **State Update** → Zustand Store
3. **Database Query** → Electron Main (IPC)
4. **Database Operation** → SQLite
5. **Response** → Renderer (IPC)
6. **UI Update** → React Re-render

### Security Architecture

- **Process Isolation**: Main and Renderer processes separated
- **IPC Validation**: All inter-process communication validated
- **Password Security**: Bcrypt hashing with salt rounds
- **Data Isolation**: All data stored locally, no external APIs
- **Context Isolation**: Preload scripts limit renderer capabilities

---

## 🔐 Security

### Data Protection

- ✅ All data stored locally on the machine
- ✅ SQLite database encryption-ready
- ✅ Passwords hashed with bcryptjs
- ✅ Session management with timeouts
- ✅ User activity logging

### Best Practices

- Always keep the application updated
- Use strong, unique passwords
- Back up your data regularly
- Run on trusted networks only
- Restrict physical access to the machine

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Application won't start** | Ensure Node.js v18+ is installed, try `npm install` again |
| **Database errors** | Delete `src/main/database` folder and restart |
| **Port 5173 already in use** | Change port in `electron.vite.config.ts` or kill the process using the port |
| **Build fails on Windows** | Install Microsoft Visual C++ redistributables |
| **Slow performance** | Check available RAM, close other applications |

### Debug Mode

```bash
# Run with debug logging
DEBUG=* npm run dev

# Open DevTools in production
Press Ctrl+Shift+I (Windows) or Cmd+Option+I (macOS)
```

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

MIT License grants you the freedom to:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute the software
- ✅ Include in proprietary applications

**Conditions**: Include a copy of the license and copyright notice.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code improvements, your help makes POS Pro better.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request** with a clear description

### Contribution Guidelines

- Follow the existing code style and structure
- Write tests for new features
- Update documentation accordingly
- Ensure all tests pass: `npm test && npm run lint`
- Keep commits atomic and well-documented
- Be respectful and constructive in discussions

### Reporting Bugs

Please use the [Issues](https://github.com/Br7eleven/pos-pro/issues) section to report bugs. Include:
- Detailed description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots/error logs if applicable
- Your system information (OS, version, etc.)

### Feature Requests

Have an idea to improve POS Pro? [Open a feature request](https://github.com/Br7eleven/pos-pro/issues/new) with:
- Clear description of the feature
- Use case and benefits
- Potential implementation approach (optional)

---

## 📊 Project Stats

- **Language**: TypeScript (69.7%), CSS (29.9%), HTML (0.4%)
- **Lines of Code**: Thousands of carefully crafted lines
- **Test Coverage**: Comprehensive unit and integration tests
- **Build Time**: < 30 seconds for development builds
- **Bundle Size**: Optimized for fast startup and low memory footprint

---

## 🗺️ Roadmap

### v1.1.0 (Planned)
- [ ] Advanced inventory management
- [ ] Multi-store sync (with internet)
- [ ] Mobile app companion
- [ ] API for third-party integrations

### v1.2.0 (Planned)
- [ ] Enhanced reporting and analytics
- [ ] Customer loyalty program
- [ ] Promotional discounts and coupons
- [ ] Multi-language support

### v2.0.0 (Future)
- [ ] Cloud synchronization
- [ ] Real-time collaboration
- [ ] AI-powered insights
- [ ] Mobile POS support

---

## 📞 Support & Community

- **Issues & Bug Reports**: [GitHub Issues](https://github.com/Br7eleven/pos-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Br7eleven/pos-pro/discussions)
- **Email Support**: support@nurture-pos.com (coming soon)
- **Documentation**: [GitHub Wiki](https://github.com/Br7eleven/pos-pro/wiki) (coming soon)

---

## 🙏 Acknowledgments

Built with ❤️ by the [Nurture POS](https://github.com/Br7eleven) team.

Special thanks to:
- The [Electron](https://www.electronjs.org/) team
- The [React](https://react.dev/) community
- All [open-source contributors](https://github.com/Br7eleven/pos-pro/graphs/contributors)

---

## 📄 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Zustand Guide](https://github.com/pmndrs/zustand)

---

<div align="center">

**Made with ❤️ for retail businesses worldwide**

[⬆ Back to top](#pos-pro)

</div>
