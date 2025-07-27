# 🚀 BOK-AI Setup Guide

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** & Docker Compose
- **Git**

## 🛠️ Szybki Start

### 1. Klonowanie i Setup
```bash
git clone <repository-url>
cd bok-ai

# Instalacja wszystkich dependencies
npm run install:all
```

### 2. Konfiguracja Environment
```bash
# Skopiuj przykładowe zmienne środowiskowe
cp env.example .env

# Edytuj .env - ustaw swoje klucze API
nano .env
```

### 3. Uruchomienie Infrastruktury
```bash
# Uruchom wszystkie serwisy (PostgreSQL, Redis, Qdrant, etc.)
npm run docker:up

# Setup AI (Ollama + Llama 3.1)
npm run setup
```

### 4. Uruchomienie Aplikacji
```bash
# Uruchom frontend i backend jednocześnie
npm run dev

# Lub osobno:
npm run frontend:dev  # Frontend na http://localhost:3000
npm run backend:dev   # Backend na http://localhost:3001
```

## 🔧 Struktura Projektu

```
bok-ai/
├── frontend/           # Next.js aplikacja
├── backend/            # Fastify API
├── docs/              # Dokumentacja
├── scripts/           # Automatyzacja
├── docker-compose.yml # Infrastruktura
└── package.json       # Workspace scripts
```

## 🌐 Dostępne Endpointy

### Frontend
- **Dashboard**: http://localhost:3000
- **Chat Monitor**: http://localhost:3000/chat
- **Knowledge Base**: http://localhost:3000/knowledge
- **Settings**: http://localhost:3000/settings

### Backend API
- **Health Check**: http://localhost:3001/health
- **Allegro Integration**: http://localhost:3001/api/allegro/*
- **Chat API**: http://localhost:3001/api/chat
- **Notifications**: http://localhost:3001/api/notifications

## 🐛 Troubleshooting

### Backend nie startuje
```bash
# Sprawdź logi
docker-compose logs

# Restart serwisów
docker-compose restart
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/health

# Sprawdź CORS w backend/src/simple-server.ts
```

### AI nie odpowiada
```bash
# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b", "prompt": "Test"}'
```

## 📚 Dodatkowe Informacje

- **Allegro Setup**: [allegro-setup.md](./allegro-setup.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) 