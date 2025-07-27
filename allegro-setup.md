# 🛒 Konfiguracja Allegro API dla BOK-AI

## 1. 📋 Rejestracja aplikacji w Allegro

### Krok 1: Przejdź do Allegro Developer Portal
- **Sandbox (testowe):** https://apps.developer.allegro.pl.allegrosandbox.pl/
- **Produkcja:** https://apps.developer.allegro.pl/

### Krok 2: Utwórz nową aplikację
1. Kliknij "Utwórz aplikację"
2. Wypełnij formularz:
   - **Nazwa aplikacji:** BOK-AI
   - **Opis:** AI Chatbot dla obsługi klienta
   - **Redirect URI:** `http://localhost:3001/api/allegro/callback`
   - **Scopes:** 
     - `allegro:api:orders:read`
     - `allegro:api:orders:write`
     - `allegro:api:messaging:read`
     - `allegro:api:messaging:write`

### Krok 3: Zapisz dane aplikacji
Po utworzeniu aplikacji otrzymasz:
- **Client ID** - skopiuj do `ALLEGRO_CLIENT_ID`
- **Client Secret** - skopiuj do `ALLEGRO_CLIENT_SECRET`

## 2. ⚙️ Konfiguracja BOK-AI

### Krok 1: Ustaw zmienne środowiskowe
```bash
# W pliku .env
ALLEGRO_CLIENT_ID=twoj-client-id
ALLEGRO_CLIENT_SECRET=twoj-client-secret
ALLEGRO_REDIRECT_URI=http://localhost:3001/api/allegro/callback
ALLEGRO_ENVIRONMENT=sandbox  # lub 'production'
```

### Krok 2: Uruchom serwer BOK-AI
```bash
cd bok-ai/backend
npm run dev
```

## 3. 🔐 Autoryzacja Allegro

### Krok 1: Zaloguj się do BOK-AI
1. Otwórz http://localhost:3000
2. Zarejestruj się lub zaloguj
3. Zapisz swój `tenantId` z odpowiedzi

### Krok 2: Autoryzuj Allegro
1. Przejdź do: `http://localhost:3001/api/allegro/auth?tenantId=TWOJ_TENANT_ID`
2. Zostaniesz przekierowany do Allegro
3. Zaloguj się swoim kontem Allegro
4. Zatwierdź uprawnienia dla aplikacji
5. Zostaniesz przekierowany z powrotem do BOK-AI

### Krok 3: Sprawdź połączenie
```bash
curl http://localhost:3001/api/threads \
  -H "Authorization: Bearer TWOJ_JWT_TOKEN"
```

## 4. 📱 Testowanie integracji

### Automatyczne odpowiedzi
- BOK-AI będzie automatycznie odpowiadać na nowe wiadomości od kupujących
- Odpowiedzi są generowane na podstawie Twojej bazy wiedzy
- Wszystkie rozmowy są logowane do celów uczenia się

### Ręczne odpowiedzi
- Możesz także odpowiadać ręcznie przez panel BOK-AI
- Przejdź do zakładki "Rozmowy" w interfejsie

## 5. 🎯 Wskazówki

### Sandbox vs Produkcja
- **Sandbox:** Bezpieczne testowanie, fałszywe dane
- **Produkcja:** Prawdziwe zamówienia i wiadomości

### Limity API
- Allegro ma limit 9000 zapytań na minutę
- BOK-AI automatycznie zarządza limitami

### Bezpieczeństwo
- Nigdy nie udostępniaj Client Secret
- Używaj HTTPS w produkcji
- Regularnie odnawiaj tokeny

## 6. 🐛 Rozwiązywanie problemów

### Błąd "Invalid client"
- Sprawdź Client ID i Client Secret
- Upewnij się, że używasz poprawnego środowiska (sandbox/production)

### Błąd "Invalid redirect URI"
- Sprawdź czy Redirect URI w aplikacji Allegro jest dokładnie taki sam
- Uwaga na końcowy slash `/`

### Brak wiadomości
- Sprawdź czy aplikacja ma uprawnienia do messaging
- Sprawdź logi serwera BOK-AI

### Kontakt z pomocą
- Dokumentacja Allegro: https://developer.allegro.pl/
- Issues BOK-AI: https://github.com/your-repo/issues

---

## 🚀 Gotowe!

Po pomyślnej konfiguracji BOK-AI będzie:
- ✅ Automatycznie odbierać wiadomości z Allegro
- ✅ Generować inteligentne odpowiedzi
- ✅ Uczyć się z każdej rozmowy
- ✅ Zapewniać 24/7 obsługę klienta

**Powodzenia z Twoim AI Botem!** 🤖 