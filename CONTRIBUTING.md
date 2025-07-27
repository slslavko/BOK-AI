# 🤝 Contributing to BOK-AI

Dziękujemy za zainteresowanie projektem BOK-AI! Oto wytyczne dotyczące współpracy.

## 🚀 Quick Start

1. **Fork** repozytorium
2. **Clone** swoje fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/BOK-AI.git
   cd BOK-AI
   ```
3. **Setup** projekt:
   ```bash
   npm install
   cd backend && npm install
   ```
4. **Create** branch dla swojej funkcjonalności:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Branch Naming Convention

- `feature/` - Nowe funkcjonalności
- `fix/` - Poprawki błędów
- `refactor/` - Refaktoryzacja kodu
- `docs/` - Aktualizacje dokumentacji
- `test/` - Dodawanie testów

Przykłady:
- `feature/allegro-notifications`
- `fix/chat-scroll-issue`
- `refactor/api-client`

## 🔧 Development Workflow

### Frontend (Next.js)
```bash
npm run dev
# Uruchamia frontend na http://localhost:3000
```

### Backend (Fastify)
```bash
cd backend
npx tsx watch src/simple-server.ts
# Uruchamia backend na http://localhost:3001
```

## 📝 Commit Message Convention

Używamy [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(chat): add real-time notifications
fix(allegro): resolve API authentication issue
docs(readme): update installation instructions
refactor(api): simplify client structure
```

### Types:
- `feat` - Nowa funkcjonalność
- `fix` - Poprawka błędu
- `docs` - Dokumentacja
- `style` - Formatowanie kodu
- `refactor` - Refaktoryzacja
- `test` - Testy
- `chore` - Konfiguracja, build, etc.

## 🧪 Testing

Przed wysłaniem Pull Request:

1. **Uruchom** aplikację lokalnie
2. **Przetestuj** nową funkcjonalność
3. **Sprawdź** czy nie zepsułeś istniejących funkcji
4. **Uruchom** linter:
   ```bash
   npm run lint
   ```

## 📤 Pull Request Process

1. **Update** branch z main:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Create** Pull Request z opisem:
   - Co zostało dodane/zmienione
   - Jak przetestować
   - Screenshots (jeśli UI)

3. **Wait** na review i feedback

## 🏗️ Project Structure

```
BOK-AI/
├── src/                    # Frontend (Next.js)
│   ├── app/               # App Router pages
│   ├── components/        # Reusable components
│   └── lib/              # Utilities & API client
├── backend/               # Backend (Fastify)
│   ├── src/
│   │   ├── services/     # Business logic
│   │   └── simple-server.ts
│   └── package.json
├── docs/                  # Documentation
├── scripts/              # Setup scripts
└── public/               # Static assets
```

## 🎯 Key Technologies

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Fastify, TypeScript
- **API**: Allegro API (OAuth 2.0)
- **Database**: PostgreSQL (planned)
- **AI**: Ollama, OpenAI (planned)

## 📞 Getting Help

- **Issues**: Używaj GitHub Issues dla bugów i feature requests
- **Discussions**: GitHub Discussions dla pytań i pomysłów
- **Email**: Dla spraw pilnych

## 🎉 Thank You!

Każdy wkład jest ceniony! Dziękujemy za pomoc w rozwoju BOK-AI! 🚀 