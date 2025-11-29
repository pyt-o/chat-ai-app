# Chat AI - Aplikacja do Czatowania z AI

Kompletna aplikacja webowa do czatowania z AI, zbudowana w technologii **React 19 + Express + tRPC + MySQL**, z uwierzytelnianiem użytkowników, zapisywaniem rozmów i trzema trybami konwersacji.

## 🎯 Funkcjonalności

- **Uwierzytelnianie użytkowników** - Logowanie przez Manus OAuth
- **Zapisywanie rozmów** - Wszystkie konwersacje są przechowywane w bazie danych
- **3 tryby konwersacji:**
  - **Ogólny** - Standardowy asystent AI
  - **Kodowanie** - Ekspert w programowaniu, zwięzłe odpowiedzi z kodem
  - **Lektorowy** - Kreatywny narrator z literackim stylem
- **Historia rozmów** - Przeglądanie i kontynuowanie poprzednich konwersacji
- **Gotowość na Premium** - Flaga `role` w bazie danych (admin/user) do rozszerzenia o funkcje płatne

## 🚀 Szybki Start (Lokalne Uruchomienie)

### Wymagania

- **Node.js** 18+ (zalecane 22+)
- **pnpm** (menedżer pakietów)
- **MySQL/TiDB** (baza danych jest automatycznie konfigurowana przez platformę Manus)

### Instalacja

```bash
# 1. Sklonuj repozytorium
git clone [URL_REPOZYTORIUM]
cd chat-ai-app

# 2. Zainstaluj zależności
pnpm install

# 3. Skonfiguruj zmienne środowiskowe
# Skopiuj plik .env.example do .env i uzupełnij wymagane wartości
cp .env.example .env

# 4. Zastosuj migracje bazy danych
pnpm db:push

# 5. Uruchom serwer deweloperski
pnpm dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## 📦 Wdrożenie na VPS

### Metoda 1: Wdrożenie przez Platformę Manus (Zalecane)

Aplikacja jest już wdrożona i działa na platformie Manus. Wszystkie zmienne środowiskowe są automatycznie konfigurowane.

**Dostęp do aplikacji:**
- URL aplikacji jest dostępny w panelu Manus
- Baza danych MySQL/TiDB jest automatycznie dostarczona
- Klucze API do LLM są wbudowane

### Metoda 2: Ręczne Wdrożenie na VPS

#### Krok 1: Przygotowanie Serwera

```bash
# Zainstaluj Node.js 22 (na Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Zainstaluj pnpm globalnie
npm install -g pnpm

# Zainstaluj PM2 do zarządzania procesami
npm install -g pm2
```

#### Krok 2: Sklonowanie i Konfiguracja Projektu

```bash
# Sklonuj repozytorium na serwer
cd /var/www  # lub inna lokalizacja
git clone [URL_REPOZYTORIUM] chat-ai-app
cd chat-ai-app

# Zainstaluj zależności
pnpm install

# Skopiuj i skonfiguruj zmienne środowiskowe
cp .env.example .env
nano .env  # Edytuj plik i uzupełnij wymagane wartości
```

#### Krok 3: Konfiguracja Zmiennych Środowiskowych

Edytuj plik `.env` i uzupełnij następujące wartości:

```bash
# Baza danych MySQL/TiDB
DATABASE_URL="mysql://user:password@host:port/database"

# Klucz do podpisywania sesji (wygeneruj losowy ciąg znaków)
JWT_SECRET="TWOJ_BARDZO_TAJNY_KLUCZ_MIN_32_ZNAKI"

# Konfiguracja OAuth (jeśli używasz własnego systemu OAuth)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"
VITE_APP_ID="twoj_app_id"

# Klucze API do LLM (Manus Forge API lub OpenAI)
BUILT_IN_FORGE_API_URL="https://api.manus.im/forge"
BUILT_IN_FORGE_API_KEY="twoj_klucz_api"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im/forge"
VITE_FRONTEND_FORGE_API_KEY="twoj_klucz_frontend"

# Informacje o właścicielu (opcjonalne)
OWNER_OPEN_ID="twoj_open_id"
OWNER_NAME="Twoje Imię"

# Tytuł i logo aplikacji
VITE_APP_TITLE="Chat AI"
VITE_APP_LOGO="/logo.png"
```

#### Krok 4: Migracja Bazy Danych

```bash
# Zastosuj migracje
pnpm db:push
```

#### Krok 5: Build Produkcyjny

```bash
# Zbuduj aplikację
pnpm build

# Aplikacja zostanie zbudowana do katalogu dist/
```

#### Krok 6: Uruchomienie za pomocą PM2

```bash
# Uruchom aplikację w trybie produkcyjnym
pm2 start pnpm --name "chat-ai-app" -- start

# Zapisz konfigurację PM2
pm2 save

# Skonfiguruj automatyczne uruchamianie po restarcie serwera
pm2 startup
# Skopiuj i wykonaj komendę wyświetloną przez PM2
```

#### Krok 7: Konfiguracja Nginx (Reverse Proxy)

Utwórz plik konfiguracyjny Nginx:

```bash
sudo nano /etc/nginx/sites-available/chat-ai-app
```

Dodaj następującą konfigurację:

```nginx
server {
    listen 80;
    server_name twoja-domena.com;  # Zmień na swoją domenę

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktywuj konfigurację:

```bash
# Utwórz symlink
sudo ln -s /etc/nginx/sites-available/chat-ai-app /etc/nginx/sites-enabled/

# Testuj konfigurację
sudo nginx -t

# Przeładuj Nginx
sudo systemctl reload nginx
```

#### Krok 8: Konfiguracja SSL (Certbot)

```bash
# Zainstaluj Certbot
sudo apt install certbot python3-certbot-nginx

# Uzyskaj certyfikat SSL
sudo certbot --nginx -d twoja-domena.com

# Certbot automatycznie skonfiguruje HTTPS i przekierowanie
```

## 🔧 Zarządzanie Aplikacją

### Sprawdzanie Statusu

```bash
# Status aplikacji
pm2 status

# Logi aplikacji
pm2 logs chat-ai-app

# Monitorowanie w czasie rzeczywistym
pm2 monit
```

### Restart Aplikacji

```bash
# Restart aplikacji
pm2 restart chat-ai-app

# Restart po aktualizacji kodu
cd /var/www/chat-ai-app
git pull
pnpm install
pnpm build
pm2 restart chat-ai-app
```

### Zatrzymanie Aplikacji

```bash
pm2 stop chat-ai-app
pm2 delete chat-ai-app
```

## 💎 Funkcje Premium

Aplikacja zawiera wbudowaną flagę `role` w tabeli `users` (wartości: `user` lub `admin`), która może być wykorzystana do implementacji funkcji premium.

### Jak Aktywować Status Premium dla Użytkownika

Połącz się z bazą danych i wykonaj:

```sql
UPDATE users SET role = 'admin' WHERE email = 'adres@email.com';
```

### Przykładowe Funkcje Premium do Dodania

| Funkcja | Implementacja |
|---------|---------------|
| **Szybsze Modele AI** | W `server/routers.ts` sprawdź `ctx.user.role === 'admin'` i użyj lepszego modelu (np. GPT-4) |
| **Więcej Trybów** | Dodaj nowe tryby konwersacji dostępne tylko dla adminów |
| **Historia bez Limitu** | Ogranicz liczbę rozmów dla użytkowników `user`, bez limitu dla `admin` |
| **Priorytetowa Kolejka** | Użytkownicy premium otrzymują odpowiedzi szybciej |

## 📁 Struktura Projektu

```
chat-ai-app/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/     # Komponenty UI
│   │   │   └── ChatInterface.tsx  # Główny interfejs czatu
│   │   ├── pages/          # Strony aplikacji
│   │   │   └── Home.tsx    # Strona główna
│   │   ├── lib/
│   │   │   └── trpc.ts     # Klient tRPC
│   │   └── App.tsx         # Routing
│   └── public/             # Pliki statyczne
├── server/                 # Backend (Express + tRPC)
│   ├── routers.ts          # Definicje API (tRPC procedures)
│   ├── db.ts               # Funkcje dostępu do bazy danych
│   └── _core/              # Konfiguracja frameworka
├── drizzle/                # Schemat i migracje bazy danych
│   └── schema.ts           # Definicje tabel
├── .env.example            # Przykładowy plik zmiennych środowiskowych
├── package.json            # Zależności projektu
└── README.md               # Ten plik
```

## 🛠️ Komendy Deweloperskie

```bash
# Uruchomienie serwera deweloperskiego
pnpm dev

# Build produkcyjny
pnpm build

# Uruchomienie w trybie produkcyjnym
pnpm start

# Sprawdzenie typów TypeScript
pnpm check

# Formatowanie kodu
pnpm format

# Testy
pnpm test

# Migracje bazy danych
pnpm db:push
```

## 🐛 Rozwiązywanie Problemów

### Problem: Błąd połączenia z bazą danych

**Rozwiązanie:**
- Sprawdź, czy `DATABASE_URL` w pliku `.env` jest poprawny
- Upewnij się, że serwer MySQL/TiDB jest uruchomiony
- Sprawdź, czy użytkownik ma uprawnienia do bazy danych

### Problem: Błąd "Cannot find module"

**Rozwiązanie:**
```bash
# Usuń node_modules i pnpm-lock.yaml
rm -rf node_modules pnpm-lock.yaml

# Zainstaluj ponownie zależności
pnpm install
```

### Problem: Aplikacja nie odpowiada na żądania

**Rozwiązanie:**
```bash
# Sprawdź logi PM2
pm2 logs chat-ai-app

# Restart aplikacji
pm2 restart chat-ai-app
```

### Problem: Błędy CORS

**Rozwiązanie:**
- Upewnij się, że Nginx jest poprawnie skonfigurowany jako reverse proxy
- Sprawdź, czy nagłówki `X-Forwarded-*` są ustawione w konfiguracji Nginx

## 📝 Licencja

MIT

## 🤝 Wsparcie

W razie problemów lub pytań, skontaktuj się przez:
- Issues na GitHubie
- Email: [twoj-email@example.com]
