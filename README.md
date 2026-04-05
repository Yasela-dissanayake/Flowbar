# 🚀 Electron Sidebar

A frameless, lighting-fast sidebar app launcher built with **Electron**, **React (Vite)**, and **Tailwind CSS**. 

Designed to sit cleanly on the edge of your screen, it keeps your favorite web apps (like Gmail, Notion, ChatGPT) partitioned in isolated memory sessions and available instantly via a global keyboard shortcut.

## ✨ Features
- **Instant Access**: Press `Ctrl` + `Shift` + `Space` from anywhere in your OS to toggle the sidebar.
- **Always on Top**: Sits frameless and unobtrusively locked to the right side of your screen.
- **Webview Isolation**: Each pinned web app runs silently in its own completely sandboxed hardware partition (`persist:ID`). Cookies and sessions never leak across apps.
- **Adaptive UX Modes**:
  - **Fluid Mode**: Click anywhere else on your screen and the sidebar immediately hides itself. 
  - **Pinned Mode**: Click the pushpin icon to lock the sidebar persistently on top of other desktop windows.
  - **Bubble Mode**: Click the minus icon to collapse the entire UI into a tiny, unobtrusive glowing 60x60 square.
- **Native File System Storage**: Custom pins and UX settings instantly persist across restarts using native Node.js File System caching.
- **Smart Favicons**: Generates beautiful fallback icons or pulls high-res favicons automatically via Google's S2 API depending on the domain.

## 🛠️ Technology Stack
* **Engine:** [Electron](https://www.electronjs.org/)
* **Frontend Sandbox:** [React 18](https://react.dev/) powered by [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS v3](https://tailwindcss.com/)
* **IPC**: Secure, Context-Isolated preload bridging with `preload.cjs`

## 📦 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Development
Run the dev environment. This command boots up the Vite HMR server and Electron concurrently:
```bash
npm run dev
# (Linux users may need to append '--no-sandbox' based on their SUID configurations)
```

### 3. Build & Package
Package the application into a standalone executable (AppImage, Snap, or EXE):
```bash
npm run dist
```
The compiled installation files will be generated inside the `/release` directory.

## ⌨️ Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Shift + Space` | Toggle visibility of the sidebar natively from anywhere on the OS |

## 🔒 Privacy & Architecture Notes
This wrapper natively implements Electron's `session.fromPartition` API prior to navigation. Your custom websites operate outside of the default anonymous partition, meaning you'll stay logged into your custom tools permanently without tracking crossing over. Removing a custom app triggers `.clearStorageData()` in the main process, instantly vaporizing the app footprint.
# Flowbar
# Flowbar
