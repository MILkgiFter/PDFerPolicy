import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const en = {
  aria_back: 'Back',
  aria_main_nav: 'Main sections',
  lang_switch_aria: 'Interface language',
  lang_en: 'EN',
  lang_ru: 'RU',
  lang_system_short: 'System',
  lang_system_aria: 'Use device language',
  nav_tools: 'Tools',
  nav_reader: 'Reader',
  nav_history: 'History',
  title_pdf: 'PDFer',
  title_reader: 'Reader',
  title_history: 'History',
  title_merge: 'Merge PDF',
  title_split: 'Split PDF',
  title_compress: 'Compress PDF',
  title_repair: 'Repair PDF',
  title_jpg_pdf: 'JPG → PDF',
  title_pdf_jpg: 'PDF → JPG',
  title_convert_office: 'PDF → Office',
  title_watermark: 'Watermark',
  title_rotate: 'Rotate pages',
  title_organize: 'Organize pages',
  title_edit_pdf: 'Edit PDF',
  title_unlock: 'Remove password',
  title_protect: 'Protect PDF',
  title_ocr_pdf: 'OCR PDF',

  pick_pdf: 'Choose PDF',
  pick_images: 'Choose images',
  pick_encrypted: 'Encrypted PDF',
  open_file: 'Open file',
  loading: 'Loading…',

  merge_intro:
    'Drag rows by the ⋮⋮ grip, use Shuffle or manual order. Order from top down is the merged PDF.',
  merge_add_pdf: 'Add PDF',
  merge_one_by_one: 'One at a time',
  merge_shuffle: 'Shuffle',
  merge_clear_list: 'Clear list',
  merge_save: 'Merge and save',
  merge_processing: 'Processing…',
  merge_skip_non_pdf: 'Non-PDF items were skipped',

  toast_min_two_pdf: 'Add at least two PDF files',
  toast_merge_done_share: 'Done. In Share → Save or pick a files app.',
  toast_merge_done_desktop: 'Saved as merged.pdf',
  toast_merge_err: 'Merge failed',
  toast_order_shuffled: 'Order shuffled',
  aria_drag_sort: 'Drag to reorder',
  aria_remove: 'Remove from list',

  compress_intro:
    'Light mode keeps quality nearly unchanged. Deep rasterizes pages to JPEG — smaller scans, text may soften slightly.',
  compress_light: 'Light',
  compress_deep: 'Deep (JPEG)',
  compress_detail: 'Render detail:',
  compress_jpeg_q: 'JPEG quality:',
  compress_run: 'Compress & download',
  compress_busy: 'Compressing…',

  toast_pick_pdf: 'Pick a PDF',
  toast_done_share: 'Done — save via Share.',
  toast_light_done: 'Light compression done',
  toast_deep_done: 'Deep compression done',
  toast_compress_fail: 'Could not compress',

  repair_intro:
    'Re-reads and saves with pdf-lib — sometimes fixes light structure issues. Not a full repair suite.',
  repair_run: 'Try repair',
  repair_busy: 'Re-saving…',
  toast_repair_done_share: 'Re-saved PDF — save via Share. Heavily damaged files may fail.',
  toast_repair_done_desktop: 'repaired.pdf is ready — check the contents',
  toast_repair_fail: 'Could not re-save',

  split_intro_each: 'Each page',
  split_intro_ranges: 'Ranges',
  split_pages_label: 'Pages (numbered from 1), comma-separated:',
  split_placeholder: 'Example: 1-3, 5, 8-10',
  split_run: 'Split & download',
  split_busy: 'Splitting…',
  toast_split_one_share: 'One PDF ready — save via Share.',
  toast_split_one: 'Single file ready',
  toast_zip_pdfs_share: 'ZIP with {count} PDFs — save via Share.',
  toast_zip_pdfs: 'ZIP with {count} PDFs',
  toast_split_no_ranges: 'No valid ranges found',
  toast_split_done_share: 'Done — save via Share.',
  toast_split_done: 'Done',
  toast_split_fail: 'Split failed',

  jpg_intro: 'Every image lands on its own A4 page; JPG and PNG.',
  jpg_selected: 'Selected files:',
  jpg_build: 'Build PDF',
  jpg_busy: 'Building…',
  toast_webp: 'WebP is not supported — pick JPG/PNG.',
  toast_pick_images: 'Select images',
  toast_jpg_done_share: 'PDF ready — save via Share.',
  toast_jpg_done: 'images.pdf is ready',
  toast_jpg_fail: 'Could not build PDF',

  pdf_jpg_intro:
    'Pages render through PDF.js, bundled as JPEGs in a ZIP. Higher scale ⇒ sharper/larger.',
  pdf_jpg_pages: 'Pages:',
  pdf_jpg_scale: 'Render scale:',
  pdf_jpg_quality: 'JPEG quality:',
  pdf_jpg_run: 'Download ZIP',
  pdf_jpg_busy: 'Exporting…',
  toast_pdf_read_fail: 'Could not read PDF',
  toast_zip_jpeg_share: 'ZIP with {count} JPEGs — save via Share.',
  toast_zip_jpeg: 'ZIP with {count} JPEGs',
  toast_export_fail: 'Export failed',

  office_intro:
    'High‑quality PDF to Word / Excel / PowerPoint needs heavy engines on a server; this app opens iLovePDF in your browser.',

  office_word: 'PDF → Word',
  office_excel: 'PDF → Excel',
  office_ppt: 'PDF → PowerPoint',
  office_opening: 'Opening…',
  office_button: '{label} — open iLovePDF',

  watermark_default: 'Draft',
  watermark_text_label: 'Text',
  watermark_opacity: 'Opacity:',
  watermark_angle: 'Angle (°):',
  watermark_run: 'Apply & download',
  watermark_busy: 'Applying…',
  toast_watermark_text: 'Enter watermark text',

  rotate_pages_label: 'Pages (comma-separated), or the keyword «{kw}»:',
  rotate_placeholder: 'e.g. 1,3,5 or {kw}',
  rotate_kw_all: 'all',
  rotate_total_line: 'Total pages {total}; changing:',
  rotate_angle: 'Angle',
  rotate_opt_90cw: '90° clockwise',
  rotate_opt_180: '180°',
  rotate_opt_270: '270° counter‑clockwise',
  rotate_run: 'Rotate & download',
  rotate_busy: 'Rotating…',

  toast_rotate_nopages: 'No pages chosen',
  toast_rotate_done_share: 'Done — save via Share.',
  toast_rotate_fail: 'Rotate failed',

  organize_intro:
    'List pages in their new order (starting at 1). Duplicates auto-collapse.',
  organize_intro_tail:
    'Pages you skip disappear from output (easy trimming).',
  organize_order_label: 'New order ({count} pages)',
  organize_preview_total: 'Total pages in PDF:',
  organize_run: 'Rebuild PDF',
  organize_busy: 'Reordering…',

  toast_organize_read_fail: 'Could not read PDF',
  toast_check_order: 'Review the page order',
  toast_organize_done_share: 'Done — save via Share. Omitted pages removed.',
  toast_organize_done: 'Done — omitted pages gone',
  toast_organize_err: 'Error',

  unlock_intro:
    'No password ⇒ straight re-save. With an open password we decrypt via pdf.js and rasterize pages (scan-like output).',

  unlock_pw_label: 'Open password when encrypted:',
  unlock_run: 'Remove password & save',
  unlock_busy: 'Working…',

  toast_unlock_done_share: 'Unlocked PDF — save via Share.',
  toast_unlock_done: 'unlocked.pdf ready',

  toast_unlock_fail: 'Wrong password or unsupported file',

  protect_intro:
    'Encrypting PDFs in pure browser tooling is scarce. Stripping passwords is local; tap below to guard a file via iLovePDF.',
  protect_main_btn: 'Protect PDF (iLovePDF)',
  protect_alt_btn: 'Alternate unlock via site',
  protect_busy_dots: '…',

  ocr_intro:
    'Tesseract OCR: pages rasterize before recognition. First run downloads packs (needs Internet). Try one page on huge files.',
  ocr_langs: 'Recognition languages',
  ocr_custom_lang: 'Custom language code',
  ocr_scope_1: 'First page only',
  ocr_scope_6: 'Up to 6 pages',
  ocr_run: 'Recognize & save TXT',
  ocr_busy: 'Recognizing…',
  ocr_log_loading: 'Loading Tesseract…',
  ocr_log_page: 'Page {i} / {limit}…',
  ocr_log_done: 'Done',
  ocr_separator: '--- Page {i} ---',
  toast_ocr_saved_share: 'TXT saved — open Share.',

  toast_ocr_saved_file: 'Saved {stem}_ocr.txt',

  toast_ocr_fail: 'OCR failed',
  toast_err_canvas: 'Canvas unavailable',

  history_intro:
    'Recent saves stay offline (≤50 rows). Compatible items reopen in Reader or Share again.',

  history_clear: 'Clear all',
  history_empty: 'No entries yet.',
  history_open: 'Open',
  history_share_again: 'Share again',
  history_delete: 'Remove',
  toast_history_removed: 'Removed',

  toast_history_cleared: 'History cleared',
  toast_share_sheet_again: 'Share sheet reopened',

  reader_supported:
    'PDF · pictures · video · TXT · Word · Excel · PowerPoint · HTML & code',

  reader_loading_alt: 'Loading {label}…',

  reader_prev_pdf: 'Previous PDF page',
  reader_prev: 'Previous',
  reader_next_pdf: 'Next PDF page',
  reader_next: 'Next',
  reader_swipe_hint:
    'Swipe ← previous · next → · Vertical scroll',

  toast_history_missing: 'History row missing',

  reader_video: 'Video',
  toast_pdf_loaded: 'PDF · {pages} pages',
  toast_pdf_open_fail: 'Could not open PDF',
  reader_pdf_loading: 'Loading PDF…',

  reader_pdf_page_swipe_arialabel:
    'PDF page — swipe sideways',

  reader_plain_trunc:
    '\n\n… truncated — roughly {count} chars max.',

  inbound_unsupported_open:
    'Opening this file type via “Open with” is not supported yet.',

  inbound_open_fail: 'Could not open',

  home_intro_a: 'On-device tools + ',
  home_intro_b: 'export history',
  home_intro_c:
    '. Office conversion and Protect use a verified browser flow; parity with heavyweight desktop tooling still wants a backend.',

  home_section_org: 'Organize',
  home_section_opt: 'Tune & heal',
  home_section_cv: 'Convert',
  home_section_edit: 'Edit',

  home_section_security: 'Security',

  home_section_smart: 'Smart',

  home_note_part1:
    'Need commercial-grade PDF→Office or queues? Plug in ',

  home_note_part2:
    ' or your own APIs — separate milestone.',

  home_note_link: 'iLoveAPI',

  home_tool_merge_title: 'Merge PDF',

  tool_merge_hint: 'Drag into order',

  tool_split_hint: 'Per-page or spans',

  tool_organize_hint: 'Reorder or drop pages',

  tool_compress_hint: 'Light vs JPEG',

  tool_repair_hint: 'pdf-lib re-save',

  tool_jpg_hint: 'Album → PDF',

  tool_pdfjpg_hint: 'ZIP of JPEG',

  tool_office_hint: 'Opens iLovePDF',

  tool_edit_hint: 'Text/image overlay',

  tool_wm_hint: 'Diagonal watermark',

  tool_rotate_hint: 'Quarter turns',

  tool_unlock_hint: 'Password known',

  tool_protect_hint: 'Online tooling',

  tool_ocr_hint: 'Tesseract RU + EN',

  home_tool_office_title: 'PDF → Word / Excel / PPT',

  edit_title: 'PDF editor',

  edit_intro_before: 'Standalone editor: preview plus tools layered on each page measured from',

  edit_intro_corner: 'lower-left',

  edit_intro_mid:
    'corner (pts). ASCII text stays vectors; Cyrillic text flattens to PNG; images JPG & PNG.',

  edit_open: 'Open PDF',
  undo: 'Undo',
  edit_save_file: 'Save',

  preview_title: 'Preview',
  prev_page: 'Prior page',

  pg_count: 'Page {cur} / {total}',

  preview_pick: 'Load a PDF to preview',

  preview_error: 'Preview error',

  tools_panel: 'Tools',
  tab_text: 'Text',
  tab_image: 'Image',

  edit_page_label: 'Edited page mirrors preview',

  ph_caption: 'Headline…',
  lbl_x_pt: 'X (pt)',
  lbl_y_bottom_pt: 'Y from bottom (pt)',

  lbl_font_sz: 'Font size',

  add_text_btn: 'Append text',

  btn_wait_short: 'Please wait…',
  lbl_width_fix: 'Width (pt)',

  embed_image_btn: 'Insert image',

  pick_jpgpng_label: 'JPG / PNG picker',

  toast_pdf_loaded_sidebar: 'PDF ready — tweak with the sidebar',

  toast_read_fail: 'Read error',

  toast_nothing_undo: 'Nothing to undo',

  undo_step: 'Step undone',

  toast_enter_text: 'Type something',
  toast_text_added: 'Text layered',

  toast_pick_jpgpng: 'Choose JPG or PNG',

  toast_image_added: 'Image layered',

  toast_no_doc: 'No PDF loaded',

  toast_saved_share_native: 'Saved — share the file',

  toast_saved_desktop_dl: 'Downloaded edited.pdf',

  toast_save_fail: 'Save failed',

  err_generic: 'Error',

  err_merge_pick_one_pdf: 'Select at least one PDF',

  err_merge_read_pdf:
    'Could not read "{name}" — try Repair PDF or pick another.',

  err_parse_bad_range: 'Bad range "{part}"',
  err_parse_bad_page: 'Bad page "{part}"',

  err_canvas: 'Canvas unavailable',

  err_pick_images: 'Choose images',

  err_wm_png_failed: 'Watermark PNG failed',

  err_reorganize_nopages: 'Nothing to reorganize',

  err_organize_empty: 'Enter a reorder list',

  err_organize_bad_num: 'Not an integer "{part}"',

  err_organize_oob: 'Page {n} falls outside 1–{total}',

  unlock_wrong_or_corrupt: 'Incorrect password or broken file',

  unlock_need_pw_or_corrupt:
    'Open password missing or PDF damaged',

  err_pdf_page_oob: 'Page {page} absent (have {total})',

  err_draw_image_formats: 'Only JPG/PNG embed',

  reader_unsupported_doc:
    '.doc is legacy — reopen as DOCX/PDF',

  reader_unsupported_ppt: '.ppt is legacy — use PPTX',

  reader_unsupported_generic: 'Reader cannot preview this type',

  reader_kind_pdf: 'PDF',
  reader_kind_image: 'Image',
  reader_kind_video: 'Video',
  reader_kind_plain: 'Text',
  reader_kind_docx: 'Word',
  reader_kind_xlsx: 'Excel',
  reader_kind_pptx: 'PowerPoint',
  reader_kind_html_file: 'HTML',

  office_share_dialog_title: 'Save or send file',

  office_share_sheet_error:
    'Share couldn’t launch — upgrade the native build.',
}

const ru = {
  aria_back: 'Назад',
  aria_main_nav: 'Основные разделы',

  lang_switch_aria: 'Язык интерфейса',

  lang_en: 'EN',

  lang_ru: 'RU',

  lang_system_short: 'Система',

  lang_system_aria: 'Язык как в настройках устройства',

  nav_tools: 'Инструменты',
  nav_reader: 'Читалка',
  nav_history: 'История',

  title_pdf: 'PDFer',

  title_reader: 'Читалка',

  title_history: 'История',

  title_merge: 'Объединить PDF',

  title_split: 'Разделить PDF',

  title_compress: 'Сжать PDF',

  title_repair: 'Восстановить PDF',

  title_jpg_pdf: 'JPG → PDF',

  title_pdf_jpg: 'PDF → JPG',

  title_convert_office: 'PDF → Office',

  title_watermark: 'Водяной знак',

  title_rotate: 'Повернуть страницы',

  title_organize: 'Организовать страницы',

  title_edit_pdf: 'Редактировать PDF',

  title_unlock: 'Снять пароль',

  title_protect: 'Защита PDF',

  title_ocr_pdf: 'OCR PDF',

  pick_pdf: 'Выбрать PDF',

  pick_images: 'Выбрать изображения',

  pick_encrypted: 'Зашифрованный PDF',

  open_file: 'Открыть файл',

  loading: 'Загрузка…',

  merge_intro:
    'Перетащите строки за ⋮⋮, используйте «Перемешать» или сортируйте вручную. Верх → низ задаёт порядок в объединении.',

  merge_add_pdf: 'Добавить PDF',

  merge_one_by_one: 'По одному',

  merge_shuffle: 'Перемешать',

  merge_clear_list: 'Очистить список',

  merge_save: 'Объединить и сохранить',

  merge_processing: 'Обработка…',

  merge_skip_non_pdf: 'Пропущены не‑PDF файлы',

  toast_min_two_pdf: 'Добавьте минимум два PDF',

  toast_merge_done_share:
    'Готово: в «Поделиться» выберите «Сохранить» или менеджер файлов.',

  toast_merge_done_desktop: 'Файл merged.pdf сохранён',

  toast_merge_err: 'Ошибка объединения',

  toast_order_shuffled: 'Порядок перемешан',

  aria_drag_sort: 'Тянуть для сортировки',

  aria_remove: 'Убрать из списка',

  compress_intro:
    '«Лёгкий» почти сохраняет качество. «Глубокий» кодирует в JPEG — архив становится заметно легче.',

  compress_light: 'Лёгкий',

  compress_deep: 'Глубокий (JPEG)',

  compress_detail: 'Детализация рендера:',

  compress_jpeg_q: 'Качество JPEG:',

  compress_run: 'Сжать и скачать',

  compress_busy: 'Сжимаем…',

  toast_pick_pdf: 'Выберите PDF',

  toast_done_share: 'Готово — сохраните через «Поделиться».',

  toast_light_done: 'Лёгкое сжатие выполнено',

  toast_deep_done: 'Глубокое сжатие выполнено',

  toast_compress_fail: 'Не удалось сжать',

  repair_intro:
    'Переоткрытие и сохранение pdf-lib — иногда помогает при лёгких ошибках структуры.',

  repair_run: 'Попробовать восстановить',

  repair_busy: 'Пересохранение…',

  toast_repair_done_share:
    'PDF пересохранён — откройте «Поделиться». Сильно повреждённые файлы могут не открыться.',

  toast_repair_done_desktop: 'Файл repaired.pdf готов',

  toast_repair_fail: 'Не удалось пересохранить',

  split_intro_each: 'Каждая страница',

  split_intro_ranges: 'Диапазоны',

  split_pages_label: 'Страницы (начиная с 1), через запятую:',

  split_placeholder: 'Пример: 1-3, 5, 8-10',

  split_run: 'Разделить и скачать',

  split_busy: 'Разделяем…',

  toast_split_one_share:
    'Один PDF готов — сохраните через «Поделиться».',

  toast_split_one: 'Готов один файл',

  toast_zip_pdfs_share: 'ZIP с {count} PDF — сохраните через «Поделиться».',

  toast_zip_pdfs: 'ZIP с {count} PDF',

  toast_split_no_ranges: 'Не получилось выделить ни одного диапазона',

  toast_split_done_share: 'Готово — сохраните файл через меню.',

  toast_split_done: 'Готово',

  toast_split_fail: 'Не удалось разделить',

  jpg_intro:
    'Изображение = одна A4‑страница, пропорции сохраняются. JPG/PNG',

  jpg_selected: 'Выбрано файлов:',

  jpg_build: 'Собрать PDF',

  jpg_busy: 'Сборка…',

  toast_webp: 'WebP пока нет — выберите JPG/PNG',

  toast_pick_images: 'Выберите изображения',

  toast_jpg_done_share: 'PDF готов — сохраните через «Поделиться».',

  toast_jpg_done: 'Файл images.pdf готов',

  toast_jpg_fail: 'Не удалось собрать PDF',

  pdf_jpg_intro:
    'Рендер PDF.js → JPEG‑кадры → ZIP.',
  pdf_jpg_pages: 'Страниц:',

  pdf_jpg_scale: 'Масштаб:',

  pdf_jpg_quality: 'JPEG‑качество:',

  pdf_jpg_run: 'Скачать ZIP',

  pdf_jpg_busy: 'Экспорт…',

  toast_pdf_read_fail: 'Не удалось прочитать PDF',

  toast_zip_jpeg_share: 'ZIP с {count} JPEG — сохраните через «Поделиться».',

  toast_zip_jpeg: 'ZIP с {count} JPEG',

  toast_export_fail: 'Ошибка экспорта',

  office_intro:
    'Честный экспорт PDF→Office требует тяжёлых серверных движков; здесь мы открываем проверенный iLovePDF во встроенном/системном браузере.',

  office_word: 'PDF → Word',

  office_excel: 'PDF → Excel',

  office_ppt: 'PDF → PowerPoint',

  office_opening: 'Открываем…',

  office_button: '{label} — открыть iLovePDF',

  watermark_default: 'Черновик',

  watermark_text_label: 'Текст',

  watermark_opacity: 'Прозрачность:',

  watermark_angle: 'Угол (°):',

  watermark_run: 'Применить и скачать',

  watermark_busy: 'Применение…',

  toast_watermark_text: 'Укажите текст водяного знака',

  rotate_pages_label: 'Страницы через запятую или слово «{kw}»:',

  rotate_placeholder: 'Например: 1,3,5 или {kw}',

  rotate_kw_all: 'все',

  rotate_total_line: 'Страниц: {total}. Меняем:',

  rotate_angle: 'Угол',

  rotate_opt_90cw: '90° по часовой',

  rotate_opt_180: '180°',

  rotate_opt_270: '270°',

  rotate_run: 'Повернуть и скачать',

  rotate_busy: 'Поворачиваем…',

  toast_rotate_nopages: 'Страницы не выбраны',

  toast_rotate_done_share: 'Готово — сохраните через «Поделиться».',

  toast_rotate_fail: 'Ошибка поворота',

  organize_intro:

    'Перечислите номера в новой последовательности от 1. Дубликаты схлопнутся автоматически.',

  organize_intro_tail:

    'Не упомянутые страницы выпадут из PDF.',

  organize_order_label: 'Новый порядок ({count} страниц)',

  organize_preview_total: 'Всего страниц в документе:',

  organize_run: 'Собрать PDF',

  organize_busy: 'Перестраиваем…',

  toast_organize_read_fail: 'Не удалось прочитать PDF',

  toast_check_order: 'Проверьте порядок',

  toast_organize_done_share:

    'Готово — сохраните через «Поделиться». Лишние страницы убраны.',

  toast_organize_done: 'Страницы не из списка удалены',

  toast_organize_err: 'Ошибка',

  unlock_intro:
    'Без пароля — просто сохранение. С паролем — расшифровка pdf.js + растеризация (как отсканированный файл).',

  unlock_pw_label: 'Пароль открытия (если зашифрован):',

  unlock_run: 'Снять пароль и сохранить',

  unlock_busy: 'Обработка…',

  toast_unlock_done_share: 'PDF сняли с шифра — сохраните через меню',

  toast_unlock_done: 'unlocked.pdf создан',

  toast_unlock_fail: 'Неверный пароль или неподдерживаемый файл',

  protect_intro:
    'Полноценное шифрование в браузере редко. Снимать локально уже можно; добавить пароль через iLovePDF.',

  protect_main_btn: 'Защитить PDF (iLovePDF)',

  protect_alt_btn: 'Запасной снять пароль на сайте',

  protect_busy_dots: '…',

  ocr_intro:
    'Локально Tesseract: первая инициализация качнет модели через интернет. Тяжёлым файлам пробуйте 1‑2 страниц.',

  ocr_langs: 'Языки распознавания',

  ocr_custom_lang: 'Код языка вручную',

  ocr_scope_1: 'Только 1‑я стр',

  ocr_scope_6: 'До 6 стр',

  ocr_run: 'Распознать и сохранить TXT',

  ocr_busy: 'Распознаём…',

  ocr_log_loading: 'Загрузка Tesseract…',

  ocr_log_page: 'Стр. {i} / {limit}…',

  ocr_log_done: 'Готово',

  ocr_separator: '--- Страница {i} ---',

  toast_ocr_saved_share: 'Текст сохранён — используйте «Поделиться».',

  toast_ocr_saved_file: 'Файл {stem}_ocr.txt сохранён',

  toast_ocr_fail: 'Ошибка OCR',

  toast_err_canvas: 'Canvas недоступен',

  history_intro:
    'Недавние результаты хранятся только на устройстве (до 50). Подходящее открывается в Читалке или «Поделиться».',

  history_clear: 'Очистить всё',

  history_empty:

    'Пока тихо. После любого сохранённого экспорта появится список.',

  history_open: 'Открыть',

  history_share_again: 'Повторить «Поделиться»',

  history_delete: 'Удалить',

  toast_history_removed: 'Удалено из истории',

  toast_history_cleared: 'История очищена',

  toast_share_sheet_again: 'Штора «Поделиться» заново',

  reader_supported:

    'PDF · картинки · видео · TXT · Word · Excel · PowerPoint · HTML и код',

  reader_loading_alt: 'Загружается {label}…',

  reader_prev_pdf: 'Предыдущая страница PDF',

  reader_prev: 'Назад',

  reader_next_pdf: 'Следующая страница PDF',

  reader_next: 'Вперёд',

  reader_swipe_hint:

    'Свайп ← назад · вперёд → · высота страницы прокручивается',

  toast_history_missing: 'Запись истории потерялась',

  reader_video: 'Видео',

  toast_pdf_loaded: 'PDF · {pages} стр',

  toast_pdf_open_fail: 'Не удалось открыть PDF',

  reader_pdf_loading: 'Открываем PDF…',

  reader_pdf_page_swipe_arialabel:

    'Страница PDF — свайп влево/вправо',

  reader_plain_trunc:

    '\n\n… обрезано: файл превышает примерно {count} символов',

  inbound_unsupported_open:

    'Такой файл из «Открыть с помощью» мы ещё не показываем.',

  inbound_open_fail: 'Не удалось открыть файл',

  home_intro_a: 'Локальный набор утилит + ',

  home_intro_b: 'быстрый архив сохранений',

  home_intro_c:

    '. Office и блок «Защита» отправляют вас в проверенный браузер; для магии enterprise всё равно нужна своя платформа.',

  home_section_org: 'Структура',

  home_section_opt: 'Размер и «лечение»',

  home_section_cv: 'Конвертация',

  home_section_edit: 'Правка',

  home_section_security: 'Безопасность',

  home_section_smart: 'Умные функции',

  home_note_part1:

    'Нужен промышленный PDF→Office и очередь файлов ',

  home_note_part2: ' или ваш backend — уже отдельный этап.',

  home_note_link: 'iLoveAPI',

  home_tool_merge_title: 'Объединить PDF',

  tool_merge_hint: 'Перетащите блоки строк',

  tool_split_hint: 'По номерам/диапазонам',

  tool_organize_hint: 'Перепаковать лист',

  tool_compress_hint: 'Лёгко или jpeg',

  tool_repair_hint: 'Спасатель pdf‑lib',

  tool_jpg_hint: 'Журнал → файл',

  tool_pdfjpg_hint: 'Архив JPEG',

  tool_office_hint: 'Страничка iLovePDF',

  tool_edit_hint: 'Текст/картинки',

  tool_wm_hint: 'Диагональ воды',

  tool_rotate_hint: 'Поворот 90‑270',

  tool_unlock_hint: 'Пароль известен',

  tool_protect_hint: 'Открывает сайт',

  tool_ocr_hint: 'Rus + Eng OCR',

  home_tool_office_title: 'PDF → Word / Excel / PPT',

  edit_title: 'Редактор PDF',

  edit_intro_before: 'Раздельное поле превью + палитры. Координаты от',

  edit_intro_corner: 'левого нижнего',

  edit_intro_mid:
    ' угла (пункты). Латиница векторами; кириллическое — PNG‑плашкой; JPG/PNG для карт.',

  edit_open: 'Открыть PDF',

  undo: 'Отмена',

  edit_save_file: 'Сохранить в файл',

  preview_title: 'Просмотр',

  prev_page: 'Прошлый',

  pg_count: 'Стр. {cur} из {total}',

  preview_pick: 'Выберите PDF для предпросмотра',

  preview_error: 'Ошибка предпросмотра',

  tools_panel: 'Инструменты',

  tab_text: 'Текст',

  tab_image: 'Картинка',

  edit_page_label: 'Страница как в окне превью',

  ph_caption: 'Подпись…',

  lbl_x_pt: 'X (пт)',

  lbl_y_bottom_pt: 'Y снизу (пт)',

  lbl_font_sz: 'Размер шрифта',

  add_text_btn: 'Текст на страницу',

  btn_wait_short: 'Подождите…',

  lbl_width_fix: 'Ширина (пт)',

  embed_image_btn: 'Вставить изображение',

  pick_jpgpng_label: 'JPG или PNG',

  toast_pdf_loaded_sidebar:

    'PDF загружен — тулбокс справа',

  toast_read_fail: 'Не удалось прочитать',

  toast_nothing_undo: 'Не чего откатывать',

  undo_step: 'Откат выполнен',

  toast_enter_text: 'Введите текст',

  toast_text_added: 'Текст добавлен',

  toast_pick_jpgpng: 'Пожалуйста JPG/PNG',

  toast_image_added: 'Картинка встроена',

  toast_no_doc: 'Файла нет',

  toast_saved_share_native: 'Файл готов к шарингу',

  toast_saved_desktop_dl: 'Скачан edited.pdf',

  toast_save_fail: 'Сохранение не удалось',

  err_generic: 'Ошибка',

  err_merge_pick_one_pdf: 'Добавьте хотя бы один PDF',

  err_merge_read_pdf:

    '«{name}» не читается — попробуйте «Восстановить PDF».',

  err_parse_bad_range: 'Странное значение диапазона «{part}»',

  err_parse_bad_page: 'Не страница: «{part}»',

  err_canvas: 'Canvas недоступен',

  err_pick_images: 'Выберите изображения',

  err_wm_png_failed: 'Водной PNG не удалось построить',

  err_reorganize_nopages: 'Непонятный порядок',

  err_organize_empty: 'Введите список новых номеров',

  err_organize_bad_num: 'Не понял число «{part}»',

  err_organize_oob: '{n}-я страница вне 1–{total}',

  unlock_wrong_or_corrupt:

    'Пароль неверен или PDF повреждён',

  unlock_need_pw_or_corrupt:

    'Откройте с паролем или проверьте файл',

  err_pdf_page_oob: 'Стр. {page} не существует (всего {total})',

  err_draw_image_formats: 'Вставить можно только JPG/PNG',

  reader_unsupported_doc:

    'DOC (старый Word) не поддерживается — сохраните docx/pdf',

  reader_unsupported_ppt:

    'Формат PPT недоступен — используйте pptx',

  reader_unsupported_generic:

    'Такую сущность читать не получится',

  reader_kind_pdf: 'PDF',

  reader_kind_image: 'Изображение',

  reader_kind_video: 'Видео',

  reader_kind_plain: 'Текст',

  reader_kind_docx: 'Word',

  reader_kind_xlsx: 'Excel',

  reader_kind_pptx: 'PowerPoint',

  reader_kind_html_file: 'HTML',

  office_share_dialog_title:

    'Сохраните или отправьте файл',

  office_share_sheet_error:

    'Не удалось открыть системный Share',

}

for (const k of Object.keys(en)) if (!(k in ru)) console.error('MISSING ru', k)

for (const k of Object.keys(ru)) if (!(k in en)) console.error('MISSING en', k)
const out = [
  '// Regenerate via: node scripts/build-dictionaries.mjs',
  "import type { AppLocale } from './detectLocale'",
  '',
  'export const dictionaries: Record<AppLocale, Record<string, string>> = {',
  `  en: ${JSON.stringify(en, null, 2).replaceAll('\n', '\n  ')},`,
  `  ru: ${JSON.stringify(ru, null, 2).replaceAll('\n', '\n  ')}`,
  '}',
]

fs.mkdirSync(path.join(__dirname, '../src/i18n'), { recursive: true })

fs.writeFileSync(path.join(__dirname, '../src/i18n/dictionaries.ts'), out.join('\n'), 'utf8')

console.log('Wrote dictionaries.ts')
