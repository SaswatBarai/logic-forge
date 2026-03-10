# LogicForge

The AI-Proof, Gamified Evaluation Platform for Modern Software Engineering.

## 🏗 Architecture
LogicForge is a monorepo managed by **Turborepo** and **pnpm workspaces**.

### 🔌 Service Topology
| Service | Network | Port (host) | Description |
|---------|---------|-------------|-------------|
| **Web (Next.js)** | `public-net` + `internal-net` | `3000` | Frontend Dashboard & Game Client |
| **API Gateway** | `public-net` + `internal-net` | `8080` | Single public entrypoint for all backend APIs & WebSockets |
| **Game API** | `internal-net` | _internal only_ | Core Game Logic & WebSockets (proxied via gateway) |
| **Question Engine** | `internal-net` | _internal only_ | Question Retrieval & Randomization |
| **Anti-Cheat** | `internal-net` | _internal only_ | Heuristic Analysis & Scoring |
| **PostgreSQL** | `internal-net` | _internal only_ | Core Database |
| **MongoDB** | `internal-net` | _internal only_ | Auth Database |
| **Redis** | `internal-net` | _internal only_ | Real-time Cache & Rate Limiting Backend |

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