# GitHub Pages (PDFer)

Содержимое этой папки публикуется как статический сайт: политика, `app-ads.txt`, главная со ссылками.

## Включить Pages

1. Репозиторий на GitHub → **Settings → Pages**.
2. **Build and deployment**: Source **Deploy from a branch**.
3. Branch: **`main`** (или ваша основная ветка), folder **`/docs`**, Save.

Сайт будет доступен как:

`https://<your-username>.github.io/<repo-name>/`

## Что указать в Google Play и AdMob

- **Веб-сайт разработчика** (Developer website): корень этого сайта, например  
  `https://<user>.github.io/pdfer`  
  (без финального `/` допустимо, как в форме консоли).
- **Privacy policy**: полный URL к политике, например  
  `https://<user>.github.io/pdfer/privacy.html`
- **`app-ads.txt`**: должен открываться как  
  `https://<user>.github.io/pdfer/app-ads.txt`

## Обновление политики или AdMob строки

Правьте **`public/privacy.html`** и **`public/app-ads.txt`**, затем из корня репозитория:

```bash
npm run site:sync-github-pages-docs
git add docs/privacy.html docs/app-ads.txt
```

Файлы `docs/index.html` и этот README правятся вручную.

## Свой домен (опционально)

В корне **`docs/`** добавьте файл **`CNAME`** с одной строкой — ваш поддомен (например `pdfer.example.com`). Настройте DNS по инструкции GitHub Pages.
