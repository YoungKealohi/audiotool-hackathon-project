# Nexus Agent

Repository for csci-4911 project 3; created by Jhun Baclaan, Kealohi Young, Joshua Leonard, and Adriane Fiesta

For **AI agents and automation**: use the conda environment and conventions in [AGENTS.md](AGENTS.md).

## Project layout

| Path | What it is |
|------|------------|
| **`backend/`** | FastAPI app (`main.py`): agent graph, MCP client wiring, HTTP/SSE routes. Python unit tests live in `backend/tests/` (pytest). |
| **`frontend/`** | React + Vite web UI (`npm run dev`, `npm run build`). Vitest runs unit tests for this app. |
| **`mcp-server/`** | TypeScript MCP server: `npm run build` then `npm start`. Vitest runs this package’s tests. |
| **`e2e/`** | Playwright end-to-end tests; expects the full stack running locally. Separate `package.json` — install deps here before running E2E. |
| **`scripts/`** | **`run_all_tests.py`** — supported entrypoint to run all test suites and write reports under `test-results/`. |

## Environment

- **Conda** manages system-level dependencies (Python 3.11, Node.js 22)
- **uv** manages Python packages for fast installation
- **npm** manages JavaScript packages for frontend, MCP server, and e2e

## Setup

```bash
# 1. Create and activate conda environment (installs Python, Node.js, uv)
conda env create -f environment.yml
conda activate NexusAgent

# 2. Install Python packages with uv
cd backend && uv pip install -r requirements.txt

# 3. Install frontend dependencies
cd ../frontend && npm install

# 4. Install MCP server dependencies
cd ../mcp-server && npm install

# 5. (Optional) E2E tests — only needed if you run Playwright / full unified test suite
cd ../e2e && npm install
```

## Run

Start **backend**, **MCP server**, and **frontend** in separate terminals (with `conda activate NexusAgent` in each):

```bash
# Terminal 1 - Backend
cd backend && uvicorn main:app --reload

# Terminal 2 - MCP Server (build first if you have not: cd mcp-server && npm run build)
cd mcp-server && npm start

# Terminal 3 - Frontend
cd frontend && npm run dev
```

E2E and full-stack testing expect these services (and a configured `.env` where required) to be up.

### Windows (optional one-shot)

On **PowerShell**, after `conda activate NexusAgent` (required so **`CONDA_PREFIX`** points at this env), from the **repository root**:

```powershell
.\scripts\run-all.ps1
```

This runs **`npm run build`** in `mcp-server/`, then starts the backend (`python main.py`), frontend (`npm run dev`), and MCP server (`npm run start`) in **separate new windows**. Prefer the three-terminal flow above if anything fails or you are not on Windows.

## Testing

**Prerequisite:** `conda activate NexusAgent` (same Python/Node as the rest of the repo).

**First-time Playwright (e2e):** after `cd e2e && npm install`, install browsers once:

```bash
cd e2e && npx playwright install
```

### Full suite (recommended)

From the **repository root**:

```bash
python scripts/run_all_tests.py
```

This runs, in order: **backend** (pytest), **mcp-server** (Vitest), **frontend** (Vitest), **e2e** (Playwright).

- **`--skip-e2e`** — skip Playwright when the stack is not running or you only changed non-E2E code.
- **Outputs:** `test-results/UNIFIED_TEST_REPORT.md` and per-component JUnit XML under `test-results/*-junit.xml`.

### Focused runs (single area)

```bash
# Backend
cd backend && python -m pytest tests/ -v

# MCP server or frontend
cd mcp-server && npx vitest run
cd frontend && npx vitest run

# E2E only (stack must already be running — see Run)
cd e2e && npx playwright test
```

### E2E prerequisites

Playwright tests assume the **backend**, **frontend**, and (for realistic flows) **MCP server** are running with `conda activate NexusAgent`. Bring the stack up using **Run** (three terminals) or, on Windows, optionally **`.\scripts\run-all.ps1`** after activation (see **Run** — Windows optional one-shot).

## Updating Dependencies

```bash
# Update Python packages (use uv)
cd backend && uv pip install <package-name>
cd backend && uv pip install -r requirements.txt --upgrade

# Update Node packages (use npm as usual)
cd frontend && npm install <package-name>
cd mcp-server && npm install <package-name>
```
