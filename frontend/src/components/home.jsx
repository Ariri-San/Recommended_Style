import React, { useEffect } from "react";
import TestStyle from "./test_style";



function Home(props) {
    // useEffect(() => {
    //     document.title = "Home";
    // }, []);

    return (
        <>
        {/* ---------- Hero Section ---------- */}
        <section className="hero-section d-flex align-items-center text-center text-white">
            <div className="container">
            <div className="hero-inner">
                <h1 className="display-4 fw-bold mb-3 fade-in">
                استایل خودت رو با هوش مصنوعی کشف کن 👕✨
                </h1>
                <p className="lead fade-in-delayed mb-3">
                پلتفرمی هوشمند برای تحلیل لباس‌ها، مشاهده استایل‌ها و دریافت پیشنهادهای مخصوص سلیقه‌ی تو.
                </p>

                <div className="hero-ctas d-flex justify-content-center gap-3 mt-4">
                <a href="#style-test" className="btn btn-primary btn-lg px-4 py-2">آزمایش رایگان</a>
                <a href="#project-info" className="btn btn-outline-light px-4 py-2">اطلاعات بیشتر</a>
                </div>
            </div>
            </div>
        </section>

        {/* ---------- About Project ---------- */}
        <section id="project-info" className="py-5 bg-light text-center">
            <div className="container">
            <h2 className="text-uppercase mb-4 fw-bold text-dark">پروژه ما چیست؟</h2>
            <p className="text-muted fs-5 mb-4 px-md-5">
                ما پلتفرمی ساختیم که با کمک هوش مصنوعی، لباس‌ها و استایل افراد را از روی عکس‌ها
                شناسایی می‌کند و محصولات مشابه از فروشگاه‌ها را نمایش می‌دهد.  
                این ابزار برای افرادی طراحی شده که دوست دارن الهام بگیرن، استایل جدید امتحان کنن
                یا محصولات مشابه لباس‌های دلخواه‌شون رو پیدا کنن.
            </p>
            </div>
        </section>

        {/* ---------- Features Section ---------- */}
        <section className="features-section py-5 text-white">
            <div className="container">
            <h2 className="text-uppercase text-center mb-5 fw-bold">
                امکانات پلتفرم ما
            </h2>
            <div className="row g-4">
                <div className="col-md-4 fade-in-step">
                <div className="feature-card p-4">
                    <img
                    src={require("../templates/img/ai-detect.jpg")}
                    alt="AI Detection"
                    className="feature-icon mb-3"
                    />
                    <h5 className="mb-2">تشخیص خودکار لباس‌ها</h5>
                    <p>با آپلود یک عکس، مدل ما لباس‌ها را به تفکیک نوع و رنگ شناسایی می‌کند.</p>
                </div>
                </div>
                <div className="col-md-4 fade-in-step">
                <div className="feature-card p-4">
                    <img
                    src={require("../templates/img/style-view.jpg")}
                    alt="Style View"
                    className="feature-icon mb-3"
                    />
                    <h5 className="mb-2">مشاهده استایل‌ها و محصولات</h5>
                    <p>می‌توانید استایل‌های مختلف را ببینید و محصولات مرتبط را بررسی کنید.</p>
                </div>
                </div>
                <div className="col-md-4 fade-in-step">
                <div className="feature-card p-4">
                    <img
                    src={require("../templates/img/recommend.jpg")}
                    alt="Recommendations"
                    className="feature-icon mb-3"
                    />
                    <h5 className="mb-2">دریافت پیشنهادهای اختصاصی</h5>
                    <p>بعد از ورود، سیستم براساس سلیقه‌ی شما پیشنهادهای شخصی‌سازی‌شده ارائه می‌دهد.</p>
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* ---------- Test Section ---------- */}
        <section id="style-test" className="py-5 bg-white">
            <div className="container text-center mb-5">
            <h2 className="text-uppercase fw-bold text-dark mb-3">تست مدل هوش مصنوعی</h2>
            <p className="text-muted">
                برای امتحان عملکرد مدل، می‌توانید عکسی از خودتان آپلود کنید و ببینید
                که سیستم چطور استایل و لباس‌های شما را شناسایی می‌کند 👇
            </p>
            </div>
            <TestStyle />
        </section>

        {/* ---------- Project Technical Details ---------- */}
        <section id="project-details" className="py-5 bg-dark text-white">
            <div className="container">
            <h2 className="text-uppercase text-center fw-bold mb-4">درباره پروژه</h2>
            
            <div className="text-section mb-5">
                <h4 className="fw-bold mb-3 text-warning">🎯 هدف پروژه</h4>
                <p className="text-light fs-6 lh-lg">
                این پروژه با هدف ساخت یک پلتفرم هوش مصنوعی برای تحلیل استایل لباس، تشخیص اجزای پوشش افراد در عکس و ارائه پیشنهادهای مشابه طراحی شده است.  
                کاربر می‌تواند با ارسال تصویر خود یا دیگران، استایل و اجزای لباس را شناسایی کند و محصولات مشابه را از بین دیتاست یا فروشگاه‌ها مشاهده کند.
                </p>
            </div>

            <div className="text-section mb-5">
                <h4 className="fw-bold mb-3 text-warning">🧩 ساختار فنی پروژه</h4>
                <ul className="fs-6 lh-lg">
                <li><strong>Backend:</strong> نوشته شده با <code>Django</code> و <code>Django REST Framework</code> برای مدیریت APIها و ارتباط با مدل‌های یادگیری ماشین.</li>
                <li><strong>AI Core:</strong> استفاده از <code>PyTorch</code> برای مدل‌های تشخیص لباس، رنگ، سن و جنسیت.  
                    در برخی نسخه‌ها از <code>TensorFlow Lite</code> نیز برای مدل‌های سبک‌تر بهره گرفته شده است.</li>
                <li><strong>Frontend:</strong> با <code>React.js</code> طراحی شده تا تجربه‌ی کاربری سریع، ریسپانسیو و تعاملی ارائه دهد.</li>
                <li><strong>Database:</strong> پایگاه داده <code>PostgreSQL</code> برای ذخیره اطلاعات کاربران، محصولات و نتایج مدل‌ها.</li>
                <li><strong>Storage:</strong> فایل‌های تصویری در <code>Media</code> (محلی یا S3) ذخیره می‌شوند و با PIL پردازش می‌گردند.</li>
                </ul>
            </div>

            <div className="text-section mb-5">
                <h4 className="fw-bold mb-3 text-warning">🤖 مدل‌های هوش مصنوعی استفاده‌شده</h4>
                <ul className="fs-6 lh-lg">
                <li><strong>🧥 مدل تشخیص لباس (Garment Detection):</strong> 
                    از نسخه سبک‌سازی‌شده <code>DeepFashion2</code> برای شناسایی بخش‌های لباس در تصویر استفاده شده.</li>
                <li><strong>🎨 مدل تشخیص رنگ:</strong> 
                    با استفاده از <code>KMeans Color Extraction</code> و شبکه‌ی سبک CNN برای تشخیص رنگ غالب هر آیتم لباس.</li>
                <li><strong>🧑 مدل تخمین سن و جنسیت:</strong> 
                    از شبکه‌های ساده‌ی <code>ResNet18</code> آموزش‌داده‌شده روی دیتاست IMDB-WIKI برای تخمین سریع سن و جنسیت.</li>
                <li><strong>🔍 مدل شباهت استایل (Embedding Model):</strong> 
                    با استفاده از <code>CLIP (OpenAI)</code> و نسخه‌ی کوچک‌شده آن برای مقایسه و جستجوی لباس‌های مشابه از روی ویژگی‌های تصویری.</li>
                </ul>
            </div>

            <div className="text-section mb-5">
                <h4 className="fw-bold mb-3 text-warning">⚙️ مراحل عملکرد سیستم</h4>
                <ol className="fs-6 lh-lg">
                <li>کاربر تصویری از خود یا یک استایل مورد علاقه آپلود می‌کند.</li>
                <li>سیستم با مدل <strong>DeepFashion</strong> لباس‌ها را تشخیص داده و هر بخش را برش (Crop) می‌دهد.</li>
                <li>برای هر بخش، مدل‌های <strong>Category</strong> و <strong>Color</strong> نوع و رنگ را تشخیص می‌دهند.</li>
                <li>ویژگی‌های تصویری (Embeddings) استخراج و با دیتابیس محصولات مقایسه می‌شوند.</li>
                <li>در نهایت، لباس‌ها و استایل‌های مشابه به کاربر نمایش داده می‌شوند.</li>
                </ol>
            </div>

            <div className="text-section mb-5">
                <h4 className="fw-bold mb-3 text-warning">🚀 نسخه بتا و چشم‌انداز آینده</h4>
                <p className="text-light fs-6 lh-lg">
                این نسخه از پروژه در حال حاضر به صورت بتا در حال توسعه است.  
                در آینده، ویژگی‌های جدیدی از جمله <strong>سیستم پیشنهاد خرید بر اساس سلیقه کاربر</strong>، 
                <strong>مدل ترکیب لباس‌ها (Outfit Builder)</strong> و <strong>جستجوی تصویری پیشرفته</strong> اضافه خواهد شد.  
                هدف نهایی، ساخت یک پلتفرم هوشمند مشابه Pinterest + Zalando با تمرکز بر هوش مصنوعی است.
                </p>
            </div>
            </div>
        </section>
        </>
    );
}

export default Home;
