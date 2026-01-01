# Recommended_Style
این مخزن یک سامانهٔ بینایی‌ماشین برای تحلیل و یافتن محصولات مشابهِ آیتم‌های پوشیدنیِ موجود در عکس‌های استایل است. پیاده‌سازی اصلی در بک‌اند Django قرار دارد و فرانت‌اند با React ساخته شده است. توضیحات زیر مستقیماً بر اساس کد موجود در پوشهٔ `backend/get_data` و اپ‌های مرتبط نوشته شده است.

ویژگی‌های اصلی (بر اساس کد)
- شناسایی آیتم‌های پوشیدنی در تصویر و برش (crop) هر آیتم — پیاده‌سازی و منطق اصلی در `backend/get_data/scripts/*`.
- استخراج embedding تصویری و طبقه‌بندی صفر-شات (zero-shot) با مدل CLIP ViT-B/32 — کلاس پیاده‌سازی‌شده: `get_data.scripts.torch_classifier.ClipZeroShotClassifier`.
- یافتن محصولات مشابه از دیتابیس با محاسبهٔ similarity بین embeddingها — توابع مرتبط در `get_data.scripts.detect_products` و endpoint `FindSimilarProductsView` در `backend/get_data/views.py`.
- ذخیرهٔ نتایج پیش‌بینی در مدل‌های `StylePredict`, `ProductPredict` و `MyStylePredict` (فیلدهای embedding، نسخهٔ پیش‌بینی، crop_image و meta در `backend/get_data/models.py`).
- API برای تست تصویر، جستجوی مشابهت بر اساس embedding و ساخت/به‌روزرسانی cropهای کاربر — ویوهای مرتبط: `TestPredictStyleView`, `FindSimilarProductsView`, `CreateCropMyStylePredictView`, `UpdateCropMyStylePredictView`, `RecommendedMyStyleView` در `backend/get_data/views.py`.

معماری و جریان داده (high-level, دقیق به کد)
1. Ingest
  - داده‌ها ممکن است توسط scrapers وارد شوند (دستورات در `backend/get_data/management/commands`, مثل `scrape_data.py`) یا کاربر تصویر آپلود کند (`MyStyle`).
2. Detect & Crop
  - اسکریپت‌های در `get_data/scripts` نواحی آیتم‌ها را تشخیص می‌دهند و `StylePredict`/`MyStylePredict` ایجاد یا آپدیت می‌کنند.
3. Embed & Classify
  - برای classification/encoding از `ClipZeroShotClassifier` در `get_data/scripts/torch_classifier.py` استفاده می‌شود که `open_clip` را بارگذاری می‌کند و روش‌های `encode_image` و `predict` را ارائه می‌دهد.
4. Similarity Search
  - `get_data.scripts.detect_products.find_similar_products` (و کلاس `FindSimilarProducts`) embedding تولیدشده را با embeddingهای محصولات موجود (در `ProductPredict.image_embedding`) مقایسه می‌کند و بهترین نتایج را برمی‌گرداند.
5. Persist
  - هر crop به یک `StylePredict` یا `MyStylePredict` تبدیل می‌شود و اطلاعاتی مثل `crop_image`, `crop_meta` (bounding box)، `image_embedding`, `prediction_model`, `version` و `predicted_at` ذخیره می‌شود.

مدل‌های کلیدی و فیلدهای مهم (بر اساس `backend/get_data/models.py`)
- `Product` — فیلدهای مهم: `site`, `is_man`, `title`, `price`, `image`, `image_local`.
- `ProductPredict` — وابسته به محصول (`product`)، فیلدهای AI: `version`, `category`, `category_score`, `color`, `color_score`, `image_embedding` (JSON), `image_embedding_dim`.
- `Style` — نمایندهٔ یک پست/استایل با فیلدهای: `site`, `id_object`, `title`, `image`, `image_local`, `is_man`, `age`, `skin_color`, `hair_color`, `height`, `body_type`.
- `StylePredict` — مربوط به یک crop از `Style`: `category`, `color`, `crop_name`, `products` (M2M), `version`, `image_embedding` (JSON), `crop_image`, `crop_meta` (JSON: شامل bounding_box)، `prediction_model`.
- `MyStyle` و `MyStylePredict` — مشابه `Style`/`StylePredict` ولی برای آپلودهای کاربر؛ `MyStylePredict` فیلدهایی مانند `predict_elapsed`, `bounding_box`, `detected_products` دارد.

نکات مهم در طراحی API (براساس `backend/get_data/serializers.py` و `views.py`)
- ورودی تست تصویر:
  - ویو: `TestPredictStyleView` (کلاس در `backend/get_data/views.py`)
  - سریالایزر ورودی: `GetTestPredictStyleSerializer` (`is_man: bool`, `image: Image`)
  - خروجی: `ShowTestPredictStyleSerializer` شامل `category`, `color`, `predict_elapsed`, `crop_name`, `crop_image` (رشته)، `bounding_box`, `products`.
- جستجوی سریع مشابهت بر اساس embedding:
  - ویو: `FindSimilarProductsView`
  - سریالایزر ورودی: `EmbeddingSerializer` (`embedding` JSON, optional filters: `category`, `color`, `is_man`, `top_n`, `page_n`)
  - خروجی: لیستی از `ProductSerializer` (شامل پیش‌بینی‌های مرتبط از `ProductPredict`).
- ایجاد/به‌روزرسانی cropهای کاربر:
  - ویوها: `CreateCropMyStylePredictView`, `UpdateCropMyStylePredictView` — سریالایزرهای `CreateCropMyStylePredictSerializer` و `UpdateCropMyStylePredictSerializer` (مختصات x1,y1,x2,y2 و شناسهٔ استایل یا predict).

ابزار خط فرمان (management commands) — فایل‌ها (موجود)
- مسیر: `backend/get_data/management/commands/`
- فایل‌های حاضر: `classify_products.py`, `predict_style.py`, `scrape_data.py`, `seed_labels.py`
- مثال‌ها (طبق پیاده‌سازی موجود):  
  - اجرای پیش‌بینی برای بازه‌ای از Styleها (در `predict_style.py`):  
    `python manage.py predict_style --start_id 1 --end_id 200 --predict-version 1 --refresh`  
  - اسکریپینگ داده‌ها: `python manage.py scrape_data ...`  
  - تولید/بارگذاری برچسب‌ها: `python manage.py seed_labels`

نحوهٔ اجرای محلی (دقیق و مبتنی بر کد)
1. کپی مخزن و ورود به پوشهٔ backend:
```bash
git clone <YOUR_REPO_URL>
cd backend
```
2. ساخت محیط و نصب وابستگی‌ها:
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```
توجه: `requirements.txt` شامل `torch==2.2.2+cpu`, `torchvision==0.17.2+cpu`, `open-clip-torch` و بسته‌های پردازش تصویر است. برای GPU باید نسخه‌های مناسب PyTorch/CUDA را جایگزین کنید.

3. مهاجرت و کارهای اولیه:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

4. اجرای سرور:
```bash
python manage.py runserver
```
فرانت‌اند: در پوشهٔ `frontend` با `npm install` و `npm start` اجرا می‌شود؛ خروجی تولید (`npm run build`) در `frontend/build` قرار می‌گیرد که توسط `Django` سرو می‌شود (`settings.py` به این پوشه اشاره دارد).

چند مثال عملی از نحوهٔ استفادهٔ توابع کد (براساس فایل‌ها)
- کلاس صفر-شات و استخراج embedding: `get_data.scripts.torch_classifier.ClipZeroShotClassifier`  
  - متدها: `encode_image(image: PIL.Image) -> torch.Tensor` و `predict(image, type_labels, color_labels) -> dict`  
- چرخهٔ تولید پیش‌بینی برای یک `MyStyle`:
  - هنگام `CreateMyStyleSerializer.create` یا `update` در `get_data/serializers.py`، متد `FindSimilarProducts.extract_image(my_style)` فراخوانی می‌شود که خود منطق detect/embed/similarity را اجرا می‌کند.
- ایجاد پیش‌بینی از یک crop دستی: ویو `CreateCropMyStylePredictView` ویو از `FindSimilarProducts.create_predict_from_crop` استفاده می‌کند و خروجی را با `MyStylePredictSerializer` بازمی‌گرداند.

بهینه‌سازی و مقیاس‌پذیری (پیشنهادات مبتنی بر کد فعلی)
- استفاده از FAISS یا Annoy برای ایندکس‌گذاری embeddingها به‌جای اسکن کامل JSONها (در `ProductPredict.image_embedding`) برای جستجوی سریع‌تر.
- اگر پردازش و استخراج embedding برای تعداد زیادی محصول/استایل لازم است، پیشنهاد می‌شود پردازش دسته‌ای با ThreadPool یا Celery انجام شود (در `core` تنظیماتی برای middleware/async وجود ندارد ولی می‌توان اضافه کرد).

مسائل اخلاقی و حریم خصوصی
- مدل‌ها و فیلدهایی که به پرسنالیزه‌سازی مربوط می‌شوند (`height`, `weight`, `birth_day`, `skin_color`, `hair_color`) حساس‌اند؛ در پیاده‌سازی واقعی نیاز به موافقت صریح کاربر، حذف داده بر حسب درخواست و مستندسازی دقیق دارید.

فایل‌ها/نقاط مرجع در کد (برای توسعه‌دهنده)
- مدل‌ها: `backend/get_data/models.py`  
- ویوها / endpointها: `backend/get_data/views.py`  
- سریالایزرها: `backend/get_data/serializers.py`  
- منطق similarity / detection: `backend/get_data/scripts/detect_products.py`  
- zero-shot classifier: `backend/get_data/scripts/torch_classifier.py`  
- management commands: `backend/get_data/management/commands/`

در صورت تمایل من می‌توانم:
- README را به‌طور کامل جایگزین و بخش «Quick start», «Deploy with Docker Compose», «Sample API requests» و «Developer notes» را اضافه کنم.  
- یا برای هر یک از endpointها مثال‌های curl/postman و قالب دقیق پاسخ‌ها (بر اساس serializerها) بنویسم.

---

اگر می‌خواهید ادامه دهم و همین README را کامل‌تر با نمونهٔ درخواست/پاسخ (مثلاً JSON نمونه برای `TestPredictStyleView` و `FindSimilarProductsView`) اضافه کنم، بگو کدام endpointها را اولویت بدهم. 

## ساختار کلی

- `backend/` — سورس Django، شامل:
  - `backend/` — تنظیمات پروژه (settings، urls و ...).
  - `core/` — مدل کاربر و منطق اصلی اپ.
  - `get_data/` — اسکریپت‌ها و مدل‌های دریافت و پردازش داده‌ها.
  - `schp/` — ماژول‌ها و چک‌پوینت‌های مربوط به human parsing / deep learning.
  - `likes/` — اپ مربوط به لایک‌ها.
  - `data/` — دیتابیس SQLite و فایل‌های رسانه (`data/db.sqlite3`, `data/media/`).
  - `requirements.txt` — وابستگی‌های پایتون.

- `frontend/` — سورس React:
  - `src/` — کدهای React.
  - `build/` — خروجی ساخته شده (برای سرو توسط Django).
  - `package.json` — اسکریپت‌ها و وابستگی‌های npm.

## پیش‌نیازها

- Python 3.10+ (یا نسخه‌ای که با بسته‌های پایتون سازگار باشد)
- Node.js + npm (برای توسعه‌ی فرانت‌اند)
- بسته‌های پایتون: نصب با `pip install -r backend/requirements.txt`
  - توجه: پروژه از مدل‌های یادگیری عمیق استفاده می‌کند (`torch`, `torchvision`, `open-clip-torch`). فایل requirements یک اشاره به نسخه‌های `+cpu` دارد — اگر می‌خواهید از GPU استفاده کنید باید نسخه‌های مناسب PyTorch را نصب کنید و ممکن است نیاز به نصب اختصاصی CUDA داشته باشید.

## راه‌اندازی محلی — Backend

1. فعال کردن virtualenv و نصب وابستگی‌ها:

```bash
python -m venv .venv
source .venv/bin/activate   # (Windows PowerShell: .venv\\Scripts\\Activate.ps1)
pip install -r backend/requirements.txt
```

2. اعمال مایگریشن‌ها و آماده‌سازی دیتابیس:

```bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
```

تذکر: تنظیمات پیش‌فرض از SQLite استفاده می‌کنند و فایل دیتابیس در `backend/data/db.sqlite3` قرار می‌گیرد. فایل‌های آپلودی/رسانه در `backend/data/media/` ذخیره می‌شوند.

3. اجرای سرور توسعه:

```bash
python manage.py runserver
```

نکته: تنظیمات در `backend/backend/settings.py` شامل `DEBUG = True` و `CORS_ALLOW_ALL_ORIGINS = True` برای توسعه است. برای استقرار حتماً تنظیمات امنیتی را به‌روزرسانی کنید (Secret key، DEBUG، ALLOWED_HOSTS).

## راه‌اندازی محلی — Frontend

1. نصب وابستگی‌ها و اجرای محیط توسعه:

```bash
cd frontend
npm install
npm start
```

فرانت‌اند معمولاً روی `http://localhost:3000` اجرا می‌شود. در حالت تولید، `npm run build` خروجی را در `frontend/build` قرار می‌دهد که توسط Django سرو می‌شود (تنظیمات `TEMPLATES` و `STATICFILES_DIRS` در `backend/backend/settings.py` به این مسیر اشاره دارند).

## اجرای با Docker (خلاصه)

- هر کدام از پوشه‌ها (`backend` و `frontend`) فایل `Dockerfile` دارند؛ برای ساخت و اجرای کانتینرها مطابق نیاز می‌توانید از همان Dockerfileها استفاده کنید یا یک Compose بنویسید که هر دو سرویس را راه‌اندازی کند.

## نکات مهم توسعه

- فایل `backend/requirements.txt` شامل پکیج‌های سنگین یادگیری عمیق است؛ نصب آن ممکن است زمان‌بر باشد و برای GPU نیاز به نسخه‌های مخصوص CUDA خواهید داشت.
- تنظیم JWT / Djoser: پروژه از `djangorestframework-simplejwt` و `djoser` استفاده می‌کند (برای احراز هویت).
- تنظیمات استاتیک و سرو فرانت‌اند: `settings.py` مسیر `frontend/build` را به `TEMPLATES` و `STATICFILES_DIRS` اضافه کرده است تا نسخه‌ی ساخته‌شده React مستقیماً سرو شود.
- فایل تنظیمات شامل آدرس چک‌پوینت `SCHP_CHECKPOINT_URL` برای ماژول‌های human parsing است.

## فایل‌های مهم

- `backend/requirements.txt` — وابستگی‌های پایتون (شامل torch +cpu اشاره‌شده).
- `backend/manage.py` — ابزار مدیریتی Django.
- `backend/backend/settings.py` — پیکربندی اصلی Django (DB، static/media، auth).
- `frontend/package.json` — اسکریپت‌ها و وابستگی React.

## تست‌ها

- پوشه‌ها حاوی فایل `tests.py` هستند (برای هر اپ). برای اجرای تست‌های Django:

```bash
cd backend
python manage.py test
```

برای تست فرانت‌اند از اسکریپت‌های `npm test` در پوشه `frontend` استفاده کنید.

## توسعه و مشارکت

- برای توسعه جدید، یک شاخه (branch) جدا بسازید و تغییرات را در آن پیاده کنید.
- قبل از مرج، اطمینان حاصل کنید که مایگریشن‌ها اجرا شده و تست‌های مرتبط موفق هستند.

---

اگر می‌خواهید من README را به‌زبان انگلیسی هم کامل‌تر کنم یا بخش‌های جداگانه (مثل راهنمای استقرار با Docker Compose، توضیح دقیق درباره‌ی ساختار دیتابیس یا نحوه‌ی اضافه کردن مدل‌های ML) را تفصیلی‌تر بنویسم، بگو تا همان‌را اضافه کنم. همچنین می‌توانم README را به‌طور کامل انگلیسی یا دوزبانه قرار دهم.  


