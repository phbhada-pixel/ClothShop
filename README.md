# 🛒 Enterprise Cloth Shop ERP (Inventory & POS System)

This is a modern, modular, and cloud-ready ERP system designed specifically for Textile and Clothing Retailers. Built with Vanilla JavaScript, Tailwind CSS, and Supabase.

## 🚀 Tech Stack
*   **Frontend:** HTML5, CSS3, Tailwind CSS, Vanilla JS (ES2025)
*   **Backend & DB:** Supabase (PostgreSQL, Auth, RLS)
*   **Hosting:** GitHub Pages (Frontend) + Supabase Cloud (Backend)

## 🛠️ Step 1: Supabase Setup
1. Create a free account at [Supabase.com](https://supabase.com/).
2. Create a new Project.
3. Go to **SQL Editor** in your Supabase dashboard and run the SQL schema provided in `Phase 2` (Users, Products, Stocks, Sales tables).
4. Go to **Authentication -> Providers** and ensure Email/Password login is enabled.
5. Go to **Project Settings -> API** and copy your `Project URL` and `anon public key`.
6. Open `js/supabase.js` in your code and replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with the copied keys.

## 💻 Step 2: Local Development
1. Clone this repository to your computer.
2. If you want to use the Tailwind CLI for compiling custom CSS:
   ```bash
   npm install -D tailwindcss
   npx tailwindcss -i ./assets/css/input.css -o ./assets/css/style.css --watch