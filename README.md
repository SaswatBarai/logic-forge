# LogicForge

The AI-Proof, Gamified Evaluation Platform for Modern Software Engineering.

## 🏗 Architecture
LogicForge is a monorepo managed by **Turborepo** and **pnpm workspaces**.

### 🔌 Service Port Map
| Service | Port | Description |
|---------|------|-------------|
| **Web (Next.js)** | `3000` | Frontend Dashboard & Game Client |
| **Game API** | `3001` | Core Game Logic & Websockets |
| **Question Engine** | `3002` | Question Retrieval & Randomization |
| **Anti-Cheat** | `3003` | Heuristic Analysis & Scoring |
| **PostgreSQL** | `5432` | Core Database |
| **MongoDB** | `27017` | Auth Database |
| **Redis** | `6379` | Real-time Cache |

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 8.15.0
- Docker & Docker Compose
- Go >= 1.22 (for Code Runner)

### Local Setup

1. **Install Dependencies**
   ```bash
   make install