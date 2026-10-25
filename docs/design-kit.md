# Design kit

OptiBudget uses a **vendored** copy of [@drycov/design-kit](https://github.com/drycov/design-kit) under `src/vendor/design-kit/`.

This avoids CI/Vercel failures when resolving `github:drycov/design-kit` as an npm dependency (TS2307).

```ts
import { applyTelegramTheme } from "./vendor/design-kit";
import "./vendor/design-kit/css/index.css";
```

Keep tokens in sync with the upstream repo when the platform palette changes.
