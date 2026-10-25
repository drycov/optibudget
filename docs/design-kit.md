# Design kit

OptiBudget uses **[@drycov/design-kit](https://github.com/drycov/design-kit)**.

```bash
npm install
npm run dev
```

- CSS: `import '@drycov/design-kit/css'` in `src/main.tsx`
- Theme: `applyTelegramTheme()` + `html[data-tg-theme]`
- Product styles (`style.css`, `cascade.css`, `catalog.css`, `map.css`) bind to `--tg-*` tokens
