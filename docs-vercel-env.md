# Vercel env для optibudget-gray.vercel.app

## Project Settings → Environment Variables

| Name | Value | Environments |
|------|--------|--------------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon public) | Production, Preview, Development |

## Важно

- Префикс `VITE_` обязателен: Vite вшивает только такие переменные в клиентский бандл.
- **Anon key** — публичный ключ (RLS защищает данные). Service role **не** класть в Vercel frontend.
- После добавления переменных: **Redeploy** (Deployments → ⋯ → Redeploy) без кэша.
- В Supabase → Authentication → URL Configuration:
  - Site URL: `https://optibudget-gray.vercel.app`
  - Redirect URLs: `https://optibudget-gray.vercel.app/**`, `http://localhost:5173/**`

## CLI (опционально)

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

## Проверка

1. Открыть https://optibudget-gray.vercel.app
2. Вкладка «Облако» — форма входа (не «не настроено»)
3. Вкладка «Карта» — OSM тайлы и рисование трасс
