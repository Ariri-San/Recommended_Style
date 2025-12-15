import React, {useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import request from "../services/requestService"



function showDateTime(date_time){
    const date = new Date(date_time);
    
    const formattedDate = date.toLocaleString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    return formattedDate
}


async function productsSimilar(predict, is_man, page_n = 1, top_n = 20, overrideCategoryId = null, is_color = null) {
    try {
        // interpret overrideCategoryId:
        // - "ALL" => no category filter (send null)
        // - null/undefined => use predicted category
        // - number => use that category id
        let cat = null;
        if (overrideCategoryId === "ALL") {
            cat = null;
        } else if (overrideCategoryId !== undefined && overrideCategoryId !== null) {
            cat = overrideCategoryId;
        } else {
            cat = predict.category ? predict.category.id : null;
        }

        let color = null;
        if (is_color){
            color = predict.color?.id || null;
        }
        const payload = {
            embedding: predict.image_embedding,
            category: cat,
            color: color,
            is_man,
            page_n,
            top_n,
        };
        const response = await request.saveObject(payload, "api/find_similar_products/");
        return response.data;
    } catch (error) {
        if (error.data) request.showError(error);
        return null;
    }
}


async function fetchStyle(id) {
  const response = await request.getObjects("api/styles/", id);
  return response.data;
}


function Style() {
    const params = useParams();
    const location = useLocation();

    const [styleData, setStyleData] = useState(null);
    const [selectedPredict, setSelectedPredict] = useState(null);
    const [paths, setPaths] = useState([]); // [{id, d, active}]
    const [productsList, setProductsList] = useState([]); // fetched products for selectedPredict
    const [perPage] = useState(20);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(false);
    const productsGridRef = useRef(null);
    const loadMoreRef = useRef(null);
    const [categoriesList, setCategoriesList] = useState([]);
    const [tempCategoryId, setTempCategoryId] = useState(null); // user selection before apply
    const [isColor, setIsColor] = useState(true);
    const [appliedCategoryId, setAppliedCategoryId] = useState(null); // last applied override
    const [genderMode, setGenderMode] = useState("predicted"); // 'predicted' | 'male' | 'female'
    const [imageSize, setImageSize] = useState({
        naturalWidth: 1,
        naturalHeight: 1,
        renderedWidth: 1,
        renderedHeight: 1,
    });
    const containerRef = useRef(null);

    // refs for DOM elements
    const predictRefs = useRef({}); // predictRefs.current[predictId] = el
    const cropRefs = useRef({}); // cropRefs.current[predictId] = el

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

    // load data
    useEffect(() => {
        let mounted = true;
        fetchStyle(params.id).then(data => { if (mounted) setStyleData(data); }).catch(e=>console.error(e));
        return () => mounted = false;
    }, [params.id, location]);

    const updatePaths = useCallback(() => {
        if (!styleData || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newPaths = [];

        styleData.predicts.forEach((predict, idx) => {
            const predEl = predictRefs.current[predict.id];
            const cropEl = cropRefs.current[predict.id];
            if (!predEl || !cropEl) return;

            const pRect = predEl.getBoundingClientRect();
            const cRect = cropEl.getBoundingClientRect();

            // center points (you can adjust attach point if you want top/right etc.)
            const startX = pRect.left + pRect.width; // right edge of predict-box
            const startY = pRect.top + pRect.height / 2;

            const endX = cRect.left; // left edge of crop card
            const endY = cRect.top + cRect.height / 2;

            // convert to container-local coordinates
            const sx = startX - containerRect.left;
            const sy = startY - containerRect.top;
            const ex = endX - containerRect.left;
            const ey = endY - containerRect.top;

            // cubic Bezier control points for smooth curve — control distance depends on horizontal gap
            //   const dx = Math.abs(ex - sx);
            //   const curvature = Math.min(200, Math.max(40, dx * 0.45));
            //   const c1x = sx + curvature;
            //   const c1y = sy;
            //   const c2x = ex - curvature;
            //   const c2y = ey;

            //   const d = `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`;

            // broken / zigzag line path (like circuit wires)
            const midX1 = sx + (ex - sx) * 0.25;
            const midX2 = sx + (ex - sx) * 0.75;
            const offsetY = (ey - sy) * 0.1; // small vertical offset for bend

            const d = `M ${sx},${sy}
                L ${midX1},${sy + offsetY}
                L ${midX2},${ey - offsetY}
                L ${ex},${ey}`;
            newPaths.push({ id: predict.id, d, active: selectedPredict?.id === predict.id });
        });

        setPaths(newPaths);
    }, [styleData, selectedPredict]);

    // update paths on data change, selection change, resize, scroll
    useEffect(() => {
        updatePaths();
    }, [styleData, selectedPredict, updatePaths]);

    // fetch products when selectedPredict changes (page 1)
    // load categories once
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const resp = await request.getObjects("api/categories/");
                if (!mounted) return;
                setCategoriesList(resp.data || []);
            } catch (e) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    // helper to compute effective is_man
    function computeEffectiveIsMan() {
        if (genderMode === "male") return true;
        if (genderMode === "female") return false;
        if (genderMode === "all") return null;
        return styleData?.is_man ?? false;
    }

    // fetch one page of products using current overrides
    async function fetchProductsPage(page_n = 1, overrideCategory = null) {
        if (!selectedPredict) return null;
        const effectiveIsMan = computeEffectiveIsMan();
        // prefer explicit overrideCategory, then appliedCategoryId
        const useCategory = overrideCategory !== undefined ? overrideCategory : appliedCategoryId;
        setLoadingProducts(true);
        const res = await productsSimilar(selectedPredict, effectiveIsMan, page_n, perPage, useCategory, isColor);
        setLoadingProducts(false);
        return res;
    }

    // auto load first page when selectedPredict changes (reset overrides)
    useEffect(() => {
        let mounted = true;
        async function loadFirst() {
            setTempCategoryId(null);
            setAppliedCategoryId(null);
            setGenderMode("predicted");
            if (!selectedPredict) {
                setProductsList([]);
                setHasMoreProducts(false);
                return;
            }
            const res = await fetchProductsPage(1);
            if (!mounted) return;
            setProductsList(res || []);
            // scroll to products grid when first page loads
            setTimeout(() => {
                if (productsGridRef.current) {
                    productsGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 80);
            setHasMoreProducts(Array.isArray(res) && res.length === perPage);
        }
        loadFirst();
        return () => { mounted = false; };
    }, [selectedPredict, perPage, styleData]);

    async function loadMoreProducts() {
        if (!selectedPredict || loadingProducts) return;
        const next = Math.floor(productsList.length / perPage) + 1;
        setLoadingProducts(true);
        const res = await fetchProductsPage(next);
        setLoadingProducts(false);
        if (res && res.length) {
            setProductsList(prev => [...prev, ...res]);
            setHasMoreProducts(res.length === perPage);
            // after appending, scroll the load-more button into view (so new items are visible)
            setTimeout(() => {
                if (loadMoreRef.current) {
                    loadMoreRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 80);
        } else {
            setHasMoreProducts(false);
        }
    }

    useEffect(() => {
        if (!containerRef.current) return;
        // handlers
        const onResize = () => updatePaths();
        const onScroll = () => updatePaths();

        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, true); // true so captures scroll in ancestors
        // also observe container resize (handles image load / layout changes)
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
    }, [updatePaths, handleImageLoad]);

    if (!styleData) return null;

    return (
        <div className="style-page-center"> {/* wrapper to center width (60%) */}
        <div className={`style-page ${productsList && productsList.length === 0 ? "no-products" : ""}`} ref={containerRef}>
            {/* left: main image */}
            <div className="style-left">
            <div className="image-wrapper">
                <img
                className="style-image"
                src={styleData.image_local || styleData.image}
                alt={styleData.title}
                onLoad={handleImageLoad}
                onClick={handleImageLoad}
                />

                {/* predict boxes (positioned absolute relative to image-wrapper) */}
                {styleData.predicts.map((predict) => {
                        const box = predict.bounding_box;
                        const isActive = selectedPredict?.id === predict.id;

                        const scaleX = imageSize.renderedWidth / imageSize.naturalWidth;
                        const scaleY = imageSize.renderedHeight / imageSize.naturalHeight;

                        const left = box.x1 * scaleX;
                        const top = box.y1 * scaleY;
                        const width = (box.x2 - box.x1) * scaleX;
                        const height = (box.y2 - box.y1) * scaleY;

                        return (
                            <div
                                key={predict.id}
                                ref={(el) => (predictRefs.current[predict.id] = el)}
                                className={`predict-box ${isActive ? "active" : ""}`}
                                style={{ left, top, width, height }}
                                onClick={() =>
                                    setSelectedPredict((prev) =>
                                    prev?.id === predict.id ? null : predict
                                    )
                                }
                            />
                        );
                    })}
            </div>
            </div>

            {/* middle: crops list */}
            <div className="style-middle">
            <h4 className="style-middle-title">پیش‌بینی‌ها</h4>
            <div className="crops-list">

                {styleData.predicts.map((predict) => {
                const isActive = selectedPredict?.id === predict.id;
                return (
                    <div
                        key={predict.id}
                        ref={el => (cropRefs.current[predict.id] = el)}
                        className={`crop-item ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedPredict(prev => prev?.id === predict.id ? null : predict)}
                    >
                        <img src={predict.crop_image} alt={predict.crop_name} />
                        <div className="crop-meta">
                            <div className="crop-title">{predict.category.title}</div>
                            {/* <div className="crop-name">{predict.crop_name}</div> */}
                        </div>
                    </div>
                );
                })}
            </div>
            </div>

            {/* right: products */}
            <div className="style-right">
            <h4 className="style-right-title">{selectedPredict ? "محصولات مشابه" : ""}</h4>
            {selectedPredict ? (
                <div className="filters-row">
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {/* <div style={{ fontSize: 12, color: "#666" }}>
                            پیش‌بینی مدل: {selectedPredict ? selectedPredict.category.title : "-"}
                        </div> */}
                        <div>
                            دسته‌بندی:&nbsp;
                            <select
                                value={ tempCategoryId !== null ? tempCategoryId : (appliedCategoryId !== null ? appliedCategoryId : "") }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "ALL") setTempCategoryId("ALL");
                                    else if (v === "") setTempCategoryId(null);
                                    else setTempCategoryId(Number(v));
                                }}
                            >
                                <option value="">{`(پیش‌بینی) ${selectedPredict.category.title}`}</option>
                                <option value="ALL">همه</option>
                                {categoriesList.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </label>
                    <label>
                        جنسیت:&nbsp;
                        <select value={genderMode} onChange={(e) => setGenderMode(e.target.value)}>
                            <option value="predicted">
                                {styleData ? (styleData.is_man ? "مرد (پیش‌بینی)" : "زن (پیش‌بینی)") : "استفاده از پیش‌بینی"}
                            </option>
                            <option value="male">مرد</option>
                            <option value="female">زن</option>
                        </select>
                    </label>
                    <label style={{ display: "inline-block", marginRight: 12 }}>
                        فیلتر رنگ:
                        <input
                            checked={isColor}
                            onChange={(e) => setIsColor(e.target.checked)}
                            type="checkbox"
                            style={{ marginLeft: 8 }}
                        />
                    </label>
                    <button onClick={async () => {
                        // apply temp selection and fetch page 1 with it
                        const toApply = (tempCategoryId !== null) ? tempCategoryId : null;
                        setAppliedCategoryId(toApply);
                        const res = await fetchProductsPage(1, toApply);
                        setProductsList(res || []);
                        setHasMoreProducts(Array.isArray(res) && res.length === perPage);
                        // clear temp selection so UI shows predicted as default
                        setTempCategoryId(null);
                        setTimeout(()=>{ if (productsGridRef.current) productsGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
                    }}>
                        اعمال
                    </button>
                </div>
                <div className="products-grid" ref={productsGridRef}>

                {/* {selectedPredict.products.map(p => (
                    <div key={p.id} className="product-card">
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                            <img src={p.image_local || p.image} alt={p.title} />
                        </a>
                        <div className="product-title">{p.title}</div>
                        <div className="product-price">
                            {p.price ? p.price.toLocaleString("fa-IR") + " تومان" : ""}
                        </div>
                    </div>
                ))} */}
                {productsList.map(p => (
                    <div key={p.id} className="product-card">
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                            <img src={p.image_local || p.image} alt={p.title} />
                        </a>
                        <div className="product-title">{p.title}</div>
                        <div className="product-price">
                            {p.price ? p.price.toLocaleString("fa-IR") + " تومان" : ""}
                        </div>
                    </div>
                ))}
                    {hasMoreProducts && (
                    <div style={{ width: "100%", textAlign: "center", marginTop: 8 }} ref={loadMoreRef}>
                        <button onClick={loadMoreProducts} disabled={loadingProducts}>
                            {loadingProducts ? "در حال بارگذاری..." : "بارگذاری بیشتر"}
                        </button>
                    </div>
                )}
                </div>
                </div>
            ) : (
                // <div className="empty-state">یک بخش را انتخاب کنید</div>
                ""
            )}
            </div>

            {/* SVG overlay for connection lines — covers whole container */}
            <svg className="connection-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {paths.map(path => (
                <path
                key={path.id}
                d={path.d}
                className={`connection-path ${path.active ? "active" : ""}`}
                strokeLinecap="round"
                />
            ))}
            </svg>
        </div>
        </div>
    );
}

export default Style;