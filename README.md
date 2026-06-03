# MetalStack — Internal StackOverflow Clone

MetalStack is a private knowledge sharing and developer Q&A platform tailored for internal team collaboration.

## Technology Stack

- **Backend**: Spring Boot 3.5 + Java 25 (Temurin), Gradle, Flyway, Spring Data JPA.
- **Frontend**: React 19, Vite 8, Vanilla CSS (Premium Dark Mode design), Axios, `keycloak-js`.
- **Identity Provider**: Keycloak 25 (OIDC Authorization Code Flow with PKCE, RBAC mapping).
- **Database**: PostgreSQL 16 (Postgres full-text search).
- **Email Server**: MailHog (dev SMTP catcher).
- **Containerization**: Google Jib + Podman.

---

## Getting Started

### 1. Start Infrastructure (Postgres, Keycloak, MailHog)
Launch the required background containers using Podman:
```bash
podman compose up -d
```
*Note: Keycloak will automatically boot and import the `metalstack` realm client configuration from `keycloak-realm.json`.*

### 2. Start the Backend API
Run the Spring Boot application. Flyway will automatically run database schema migrations on start:
```bash
cd backend
./gradlew bootRun
```
*The server will start on port `8080`.*

### 3. Seed Database (External Script)
Once the backend is running and migrations are finished, execute the external seed script to populate development data:
```bash
./seed.sh
```
*This populates Alice (`user1`), Bob (`user2`), Moderator (`moderator`), and Admin (`admin`) profiles, together with test questions, votes, comments, and answers.*

### 4. Start the Frontend
Install node dependencies and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
*The React app will open on [http://localhost:5173/](http://localhost:5173/).*

---

## Development Accounts

| Username | Password | Role | Description |
|---|---|---|---|
| **`admin`** | `admin` | `ADMIN` | Can delete any question, answer, or comment. |
| **`moderator`** | `moderator` | `MODERATOR` | Can close/lock questions. |
| **`user1`** | `user1` | `USER` | Alice Developer (author of Question 1). |
| **`user2`** | `user2` | `USER` | Bob Architect (author of Question 2). |

---

## Features

1. **Secure OIDC Auth**: Keycloak handles registration, credentials, and tokens. The frontend uses `keycloak-js` and the backend is a pure OAuth2 Resource Server validating JWTs.
2. **Curated Tagging**: Auto-suggesting tags search bar (`GET /api/tags/search`) which guides users to select from existing tags, while allowing new ones.
3. **Rich Markdown**: Write and render full Markdown for questions, answers, and comments (includes code block syntax highlighting).
4. **Email Alerts**: Trigger asynchronous email notifications when someone answers your question (preference togglable in User Profile).
5. **Interactive Voting**: Vote up/down on questions/answers with visual feedback.
6. **Reputation Engine**: Users accumulate reputation points when they write quality answers or have their answer accepted.
