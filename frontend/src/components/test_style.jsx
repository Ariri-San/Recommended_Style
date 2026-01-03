import React, { useState, useEffect, useRef, useCallback  } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import request from "../services/requestService";


function TestStyle() {
    const params = useParams();
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [isMan, setIsMan] = useState(true);
    const [loading, setLoading] = useState(false);
    const [scanActive, setScanActive] = useState(false);
    const [results, setResults] = useState(null);
    const [selectedPredict, setSelectedPredict] = useState(null);
    const [paths, setPaths] = useState([]);
    
    

    const imageRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) return;

        setResults(null);
        setLoading(true);
        setScanActive(true);

        // 模拟 ارسال داده به بک
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("is_man", isMan);

        try {
        // شبیه‌سازی تاخیر سرور با setTimeout
        setTimeout(async () => {
            // 🔹 در اینجا به جای request.post از بک، داده تستی رو می‌ذاریم
            const res = await request.saveObject(formData, "api/test_predict_style/");
            setResults(res.data);
            setScanActive(false);
            setLoading(false);
        }, 300);
        } catch (error) {
            console.error(error);
            setScanActive(false);
            setLoading(false);
        }
    };

    const [imageSize, setImageSize] = useState({
        naturalWidth: 1,
        naturalHeight: 1,
        renderedWidth: 1,
        renderedHeight: 1,
    });

    const containerRef = useRef(null);
    const predictRefs = useRef({});
    const cropRefs = useRef({});

    // 🔹 When image loads, capture real & rendered size
    const handleImageLoad = (e) => {
        const img = e.target;
        setImageSize({
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            renderedWidth: img.clientWidth,
            renderedHeight: img.clientHeight,
        });
        setTimeout(updatePaths, 100);
    };

    useEffect(() => {
        const updateImageSize = () => {
            const img = imageRef.current;
            if (!img) return;
            setImageSize({
            naturalWidth: img.naturalWidth || 1,
            naturalHeight: img.naturalHeight || 1,
            renderedWidth: img.clientWidth || 1,
            renderedHeight: img.clientHeight || 1,
            });
        };

        // وقتی عکس لود یا resize شد
        const img = imageRef.current;
        if (img && img.complete) updateImageSize();
        else img?.addEventListener("load", updateImageSize);

        window.addEventListener("resize", updateImageSize);

        // برای ریسپانسیو container
        const ro = new ResizeObserver(updateImageSize);
        if (img) ro.observe(img);

        return () => {
            img?.removeEventListener("load", updateImageSize);
            window.removeEventListener("resize", updateImageSize);
            ro.disconnect();
        };
    }, []);

    

    // 🔹 Draw connecting lines between predict boxes & crops
    const updatePaths = useCallback(() => {
        if (!results || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newPaths = [];

        results.forEach((predict) => {
            const predEl = predictRefs.current[predict.crop_name];
            const cropEl = cropRefs.current[predict.crop_name];
            if (!predEl || !cropEl) return;

            const pRect = predEl.getBoundingClientRect();
            const cRect = cropEl.getBoundingClientRect();

            const sx = pRect.left + pRect.width - containerRect.left;
            const sy = pRect.top + pRect.height / 2 - containerRect.top;
            const ex = cRect.left - containerRect.left;
            const ey = cRect.top + cRect.height / 2 - containerRect.top;

            // 🔸 Zigzag connection path
            const midX1 = sx + (ex - sx) * 0.25;
            const midX2 = sx + (ex - sx) * 0.75;
            const offsetY = (ey - sy) * 0.1;

            const d = `M ${sx},${sy}
                        L ${midX1},${sy + offsetY}
                        L ${midX2},${ey - offsetY}
                        L ${ex},${ey}`;
            newPaths.push({ id: predict.crop_name, d, active: selectedPredict?.crop_name === predict.crop_name });
        });

        setPaths(newPaths);
    }, [results, selectedPredict]);

    useEffect(() => {
        updatePaths();
    }, [results, selectedPredict, imageSize, updatePaths]);

    // 🔹 Recalculate on resize / scroll
    useEffect(() => {
        if (!containerRef.current) return;
        const onResize = () => updatePaths();
        const onScroll = () => updatePaths();

        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, true);

        let ro = null;
        if (window.ResizeObserver && containerRef.current) {
        ro = new ResizeObserver(() => updatePaths());
        ro.observe(containerRef.current);
        }

        return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll, true);
        if (ro) ro.disconnect();
        };
    }, [updatePaths]);


    return (
        <div className="test-style-container">
        <h2>تست تشخیص استایل</h2>

        {/* فرم آپلود */}
        {!results && (
            <form onSubmit={handleSubmit} className="upload-form card p-4">
            <div className=" w-50 form-row d-flex flex-column align-items-center">
                <label className="upload-label btn btn-outline-primary">
                <input type="file" accept="image/*" onChange={handleImageChange} style={{display: "none"}} />
                انتخاب/آپلود عکس
                </label>

                {imageFile && <div className="mt-2 small text-muted">{imageFile.name} :فایل انتخاب‌شده</div>}

                <div className="gender-select mt-3 d-flex gap-3">
                <label className="btn btn-sm btn-outline-secondary">
                    <input type="radio" name="gender" value="true" checked={isMan} onChange={() => setIsMan(true)} style={{marginLeft:8, display:"flex"}} />
                    مردانه
                </label>
                <label className="btn btn-sm btn-outline-secondary">
                    <input type="radio" name="gender" value="false" checked={!isMan} onChange={() => setIsMan(false)} style={{marginLeft:8, display:"flex"}} />
                    زنانه
                </label>
                </div>

                <button type="submit" className="btn btn-primary mt-3" disabled={!imageFile || loading}>
                {loading ? "در حال پردازش..." : "ارسال برای تحلیل"}
                </button>
            </div>

            {loading && <div className="loading-overlay">در حال پردازش تصویر...</div>}
            </form>
        )}

        {/* نمایش تصویر انتخاب‌شده */}
        {imageUrl && !results && (
            <div className="scan-preview">
            <div className="scan-image-wrapper" ref={imageRef}>
                <img src={imageUrl} alt="preview" className="scan-image" />
                {scanActive && <div className="scan-line" />}
            </div>
            <p>در حال اسکن تصویر...</p>
            </div>
        )}

        {/* نمایش نتایج */}
        {results && (
            <>
            <div className="results-header mb-3 text-center">
                <h3 className="mb-0">نتایج تحلیل ({results.length})</h3>
                <p className="text-muted small">روی یک پیش‌بینی کلیک کنید تا محصولات مشابه نمایش داده شوند.</p>
            </div>
                <div className={`style-page ${selectedPredict && ((selectedPredict.products?.length || 0) === 0) ? "no-products" : ""}`} ref={containerRef}>
                    {/* 🔹 Left: Main Image */}
                    <div className="style-left">
                    <div className="image-wrapper">
                        <img
                            className="style-image"
                            src={imageUrl}
                            onLoad={handleImageLoad}
                            onClick={handleImageLoad}
                        />

                        {/* 🔹 Predict boxes with scaling */}
                        {results.map((predict) => {
                            const box = JSON.parse(predict.bounding_box);
                            const isActive = selectedPredict?.crop_name === predict.crop_name;

                            const scaleX = imageSize.renderedWidth / imageSize.naturalWidth;
                            const scaleY = imageSize.renderedHeight / imageSize.naturalHeight;

                            const left = box.x1 * scaleX;
                            const top = box.y1 * scaleY;
                            const width = (box.x2 - box.x1) * scaleX;
                            const height = (box.y2 - box.y1) * scaleY;

                            // console.log(box, box.x1, width, height);

                            return (
                                <div
                                    key={predict.crop_name}
                                    ref={(el) => (predictRefs.current[predict.crop_name] = el)}
                                    className={`predict-box ${isActive ? "active" : ""}`}
                                    style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }}
                                    onClick={() =>
                                        setSelectedPredict((prev) =>
                                        prev?.crop_name === predict.crop_name ? null : predict
                                        )
                                    }
                                />
                            );
                        })}
                    </div>
                    </div>

                    {/* 🔹 Middle: Crops */}
                    <div className="style-middle">
                    <h4 className="style-middle-title">پیش‌بینی‌ها</h4>
                    <div className="crops-list">
                        {results.map((predict) => {
                        const isActive = selectedPredict?.crop_name === predict.crop_name;
                        return (
                            <div
                            key={predict.crop_name}
                            ref={(el) => (cropRefs.current[predict.crop_name] = el)}
                            className={`crop-item ${isActive ? "active" : ""}`}
                            onClick={() =>
                                setSelectedPredict((prev) =>
                                prev?.crop_name === predict.crop_name ? null : predict
                                )
                            }
                            >
                            <img src={predict.crop_image} alt={predict.crop_name} />
                            <div className="crop-meta">
                                <div className="crop-title">{predict.category.title}</div>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    </div>

                    {/* 🔹 Right: Products */}
                    <div className="style-right">
                    <h4 className="style-right-title">محصولات مشابه</h4>
                    {selectedPredict ? (
                        <div className="products-grid">
                        {selectedPredict.products.map((p) => (
                            <div key={p.crop_name} className="product-card">
                            <a href={p.url} target="_blank" rel="noopener noreferrer">
                                <img src={p.image_local || p.image} alt={p.title} />
                            </a>
                            <div className="product-title">{p.title}</div>
                            <div className="product-price">
                                {p.price ? p.price.toLocaleString("fa-IR") + " تومان" : ""}
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        ""
                    )}
                    </div>

                    {/* 🔹 SVG Connections */}
                    <svg
                    className="connection-svg"
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    {paths.map((path) => (
                        <path
                        key={path.crop_name}
                        d={path.d}
                        className={`connection-path ${path.active ? "active" : ""}`}
                        strokeLinecap="round"
                        />
                    ))}
                    </svg>
                </div>
            </>
        )}
        </div>
    );
}

export default TestStyle;
