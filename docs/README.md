# Сайт разработчика (GitHub Pages, несколько приложений)

Структура **один сайт → много приложений**:

| Что нужно для Play / AdMob | Где лежит |
|----------------------------|-----------|
| **Веб-сайт разработчика** (один общий URL на все приложения здесь) | Корень после деплоя, напр. `https://USER.github.io/REPO/` |
| **`app-ads.txt`** | `https://USER.github.io/REPO/app-ads.txt` (всегда **корень** этого деплоя) |
| Политика для приложения PDFer | `https://USER.github.io/REPO/apps/pdfer/privacy.html` |
| Карточка PDFer по человеческому пути | `https://USER.github.io/REPO/apps/pdfer/` |

Добавление других приложений — см. `apps/README.md`.

## 1. Создание сайта «с нуля»

1. Репозиторий на GitHub (этот уже есть или новый общий **`developer-site`** — как удобнее).
2. В репозитории папка **`docs/`** с этими файлами (уже в проекте).
3. Запушить ветку `main`.

## 2. Включить GitHub Pages

1. **Settings → Pages**
2. **Source**: Deploy from branch **main** (или основная ветка)
3. **Folder**: **`/docs`**
4. Сохранить. Через 1–3 минуты сайт будет по адресу  
   `https://<username>.github.io/<repo-name>/`

Опционально: **Custom domain** — в `docs/` положите файл **`CNAME`** с одной строкой (ваш домен), настройте DNS по подсказкам GitHub.

## 3. Синхронизация после правок

Исходник политики и строки AdMob в приложении живут в **`public/privacy.html`** и **`public/app-ads.txt`**.

Из корня репозитория:

```bash
npm run site:sync-github-pages-docs
git add docs/app-ads.txt docs/apps/pdfer/privacy.html
git commit -m "Sync Play static docs"
git push
```

Страницы **`docs/index.html`**, **`docs/apps/pdfer/index.html`**, **`docs/apps/README.md`**, **`docs/.nojekyll`** правятся вручную.

## 4. Google Play (для каждого приложения)

- **Website** (контакт разработчика): `https://<username>.github.io/<repo>/` — **та же строка**, что ты реально проверишь в браузере без 404 (с `/` или без — как договорился с формой, главное одинаково везде).
- **Privacy policy**: полный HTTPS на политику, для PDFer:  
  `…/apps/pdfer/privacy.html`

## 5. AdMob

Открой в инкогнито **`https://<base>/app-ads.txt`** — текстовая строка с `google.com, pub-…`.

В аккаунте AdMob запусти заново проверку / сканирование. Если раньше в Play был другой домен (**garticphone.space** и т.д.) — смени **веб-сайт** на этот новый базовый URL и дождись обновления.

## Зачем подпуть `apps/pdfer/`

Так можно держать **много приложений** в одном репозитории и на одном домене: одна политика AdMob в корне, отдельные **privacy** и лендинги по папкам. Альтернатива — отдельный репозиторий на приложение; тогда тоже один `app-ads.txt` в корне **того** сайта, если в Play для этого приложения указан именно его URL.
