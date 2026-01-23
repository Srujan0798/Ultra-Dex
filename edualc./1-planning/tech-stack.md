# ðŸ—ï¸ Tech Stack & Architecture

## 1. Technology Stack

This project is a robust, scalable **Rest-iN-U** with specialized AI capabilities.

## **Frontend (Client-Side)**

*   **Framework:** **Next.js 14** (React)
    *   *Why:* Best for SEO, performance (SSR/ISR), and developer experience.
*   **Styling:** **Tailwind CSS**
    *   *Why:* Rapid UI development, modern aesthetics, and responsiveness.
*   **State Management:** **Zustand**, **TanStack Query** (React Query)
    *   *Why:* Efficient global state and server-state management.
*   **UI Components:** **Radix UI**, **Lucide React**, **Framer Motion**
    *   *Why:* Accessible primitives, beautiful icons, and smooth animations.
*   **Maps & Visualization:** **Mapbox GL**, **Recharts**
    *   *Why:* Interactive maps and data visualization charts.
*   **Forms:** **React Hook Form**, **Zod**
    *   *Why:* Performant form handling with schema validation.
*   **Web3:** **Wagmi**, **Viem**, **RainbowKit**
    *   *Why:* Blockchain wallet connection and interaction.
*   **Testing:** **Jest**, **Playwright**, **Storybook**
    *   *Why:* Unit, E2E, and component testing.

## **Backend (Main API)**

*   **Runtime:** **Node.js**
*   **Framework:** **Express.js**
    *   *Why:* Industry standard, vast ecosystem, easy to scale.
*   **Database:** **PostgreSQL** (via **Prisma ORM**)
    *   *Why:* Relational data integrity for users, properties, and transactions.
*   **Caching & Queues:** **Redis**, **Bull**
    *   *Why:* Fast session management, caching, and background job processing.
*   **Authentication:** **Passport.js**, **JWT**
    *   *Why:* Secure user authentication and session management.
*   **Payments:** **Stripe**
    *   *Why:* Secure payment processing.
*   **AI/ML Integration:** **TensorFlow.js**
    *   *Why:* Running lightweight models directly in Node.js.
*   **Logging:** **Winston**, **Morgan**
    *   *Why:* Comprehensive application logging.
*   **Documentation:** **Swagger (OpenAPI)**
    *   *Why:* Auto-generated API documentation.

## **AI/ML Service (Specialized)**

*   **Runtime:** **Python**
*   **Framework:** **Flask**
    *   *Why:* Lightweight web framework for serving AI models.
*   **Function:** Handles complex calculations (Tridosha, Vastu algorithms) and AI model inference.
*   **Communication:** Communicates with the Main Backend via HTTP APIs.

---

## 2. Architecture Overview

We are using a **Service-Oriented Architecture**:

1.  **Frontend (Next.js)**: Serves the UI and handles user interaction. It calls the **Main Backend** for data.
2.  **Main Backend (Express)**: The "Brain". Handles auth, database, payments, and business logic. It delegates complex AI tasks to the **AI Service**.
3.  **AI Service (Python)**: The "Expert". Receives data, performs analysis (e.g., image recognition, complex math), and returns results to the Backend.
4.  **Database (PostgreSQL)**: Stores all persistent data (users, properties, transactions).
5.  **Cache (Redis)**: Caches frequent data and manages sessions.

---

## 3. Hosting Strategy

Recommended modern cloud platforms for deployment:

## **Option A: The "Vercel + Render" Stack (âœ… SELECTED)**

*   **Frontend:** **Vercel**
    *   *Pros:* Native Next.js support, global CDN, zero-config deployment.
    *   *Cost:* Free tier available.
*   **Backend (Node.js) & AI (Python):** **Render**
    *   *Pros:* Supports Docker, Node.js, and Python natively. Managed PostgreSQL and Redis.
    *   *Cost:* Free tier for services, small cost for databases.
*   **Database:** **Neon** (Serverless Postgres) or Render's Managed Postgres.

> [!TIP]
> **Ready to Deploy?**
> See the step-by-step instructions in [10 Deployment Guide.md](./10%20Deployment%20Guide.md).

## **Option B: The "All-in-One" Stack**

*   **Platform:** **Railway** or **DigitalOcean App Platform**
    *   *Pros:* Host everything (Frontend, Backend, AI, DB) in one project dashboard.
    *   *Cost:* Pay-as-you-go (usually starts ~$5/mo).

---

## 4. How to Run (Development)

## **Prerequisites**

*   **Node.js (v18+)** and **npm**
*   **Docker Desktop** (Optional but recommended)

## **Option A: Using Node.js (Standard)**

1.  **Install Dependencies:**
    ```bash
    # Backend
    cd backend
    npm install

    # Frontend
    cd ../frontend
    npm install
    ```
2.  **Start Backend:**
    ```bash
    cd backend
    npm run dev
    ```
3.  **Start Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

## **Option B: Using Docker (Recommended)**

If you have Docker Desktop installed:
1.  Run `docker-compose up --build` in the root directory.
2.  This will automatically set up the Frontend, Backend, Database, and Redis without needing Node.js installed locally.
