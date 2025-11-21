# Django + Next.js Template

Django + Nextjs Template: Standardised CFC Tech Stack

---

# Get Started

Choose your preferred way to set up:

- With Dev container: [Quick Start (Dev Container)](#quick-start-dev-container---recommended)
- Without Dev container: [Local Development Setup](#local-development-setup)

## Quick Start (Dev Container) - Recommended

The easiest way to get started is using the VS Code Dev Container:

1. **Prerequisites**:

   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Dev Container**:

   - Clone this repository
   - Open the project in VS Code
   - When prompted, click "Reopen in Container" or use `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"

3. **Start the application**:

   ```bash
   # Terminal 1: Start the frontend
   cd client && npm run dev

   # Terminal 2: Start the backend
   cd server && python manage.py runserver
   ```

4. **Access the application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - Admin panel: [http://localhost:8000/admin](http://localhost:8000/admin)

---

## Local Development Setup

**Note**: Only follow these steps if you're **NOT using the dev container**. You will use Docker for the database and have all dependencies locally.

### Prerequisites

- **Node.js 20.x.x** and **npm** - [Download here](https://nodejs.org/)
- **Python 3.12.x** - [Download here](https://python.org/)
- **Poetry** (Python package manager) - [Installation guide](https://python-poetry.org/docs/#installation)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <project-name>
```

#### 2. Install Prerequisites

**Poetry (Python package manager)**

```bash
# Official installer (all OSes)
curl -sSL https://install.python-poetry.org | python3 -

# If that fails, use pip (all OSes)
pip install poetry
```

#### 3. Start the Database

**Make sure Docker is running**

```bash
cd server && docker compose up -d
```

#### 4. Set Up Environment Variables

Before proceeding, create your environment files by copying the examples:

```bash
cp ./client/.env.example ./client/.env && cp ./server/.env.example ./server/.env # From root directory
```

**Backend (`.env` in `server/`)**

```env
APP_NAME=DjangoAPI
APP_ENV=DEVELOPMENT
API_SECRET_KEY=your-secret-key-here
API_ALLOWED_HOSTS=.localhost 127.0.0.1 [::1]

POSTGRES_HOST=localhost
POSTGRES_NAME=your_db_name
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432

DJANGO_SUPERUSER_PASSWORD=Password123
DJANGO_SUPERUSER_EMAIL=admin@test.com
DJANGO_SUPERUSER_USERNAME=admin

FRONTEND_URL=http://localhost:3000
```

**Frontend (`.env` in `client/`)**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api
```

#### 5. Set Up the Backend (Django)

```bash
cd server
poetry env use <your-python3.12-path> # specify python version
poetry install
poetry shell # if this fails, run: `poetry env activate` to check the virtual environment <path>. Then run `source <path>`
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver
```

#### 6. Set Up the Frontend (Next.js)

```bash
cd client
npm install
npm run dev
```

#### 7. Verify Installation

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- Admin panel: [http://localhost:8000/admin](http://localhost:8000/admin)

---

# Development Commands

## Backend (Django)

```bash
cd server

# Run development server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Reset database (nuclear option)
./nuke.sh
```

### Create and run migrations

If the models are updated, be sure to create a migration:

```bash
python manage.py makemigrations # create migration
python manage.py migrate # apply migrations
```

### Nuke the DB

If you run into migration conflicts that you can't be bothered to fix, run `nuke.sh` to clear your database. Then, run migrations again.

## Frontend (Next.js)

```bash
cd client

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck

# Format code
npm run format
```

If you are **using the Dev Container and you update dependencies** (for example, you change requirements in pyproject.toml, package.json, or the Dockerfile), you should follow these steps:

1. Rebuild the Dev Container (using “Dev Containers: Rebuild and Reopen in Container” in VS Code)
2. After the container rebuilds and you are inside it, run `npm install` in the `client\` directory to install any new or updated Node.js dependencies.

---

# Other

## Update Dependencies

You can run `npm install` and `poetry install` in the respective `client` and `server` folders to install the newest dependencies.

## Editing Docker stuff

- If you modify anything in the `docker` folder, you need to add the `--build` flag or Docker won't give you the latest changes. e.g. `docker compose up -d --build`
- `docker ps` to check the status
- `docker compose down` to stop the container

## Changing env vars

Edit the `.env` file in the respective directory (client or server).
