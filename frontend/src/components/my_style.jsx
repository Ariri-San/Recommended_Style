import React, {useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import request from "../services/requestService"




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


async function addProduct(product, predict, id, styleData, setStyleData) {
    try {
        request.saveObject({"product": product.id}, "api/my_styles/"+id+"/predicts/", predict.id);
        styleData.predicts.map((predict_c) => {
            if (predict_c.id === predict.id){
                predict_c.product = product;
            }
        });
        setStyleData({...styleData});
    } catch (error) {
        if (error.data) request.showError(error);
    }
}


async function fetchStyle(id) {
  const response = await request.getObjects("api/my_styles/", id);
  return response.data;
}

function MyStyle({user}) {
    const params = useParams();
    const location = useLocation();

    const [styleData, setStyleData] = useState(null);
    const [selectedPredict, setSelectedPredict] = useState(null);
    const [paths, setPaths] = useState([]);
    const [imageSize, setImageSize] = useState({
        naturalWidth: 1,
        naturalHeight: 1,
        renderedWidth: 1,
        renderedHeight: 1,
    });

    const [loadingProducts, setLoadingProducts] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(false);
    const productsGridRef = useRef(null);
    const containerRef = useRef(null);
    const predictRefs = useRef({});
    const cropRefs = useRef({});
    const [categoriesList, setCategoriesList] = useState([]);
    const [tempCategoryId, setTempCategoryId] = useState(null);
    const [appliedCategoryId, setAppliedCategoryId] = useState(null);
    const [isColor, setIsColor] = useState(true);
    const [genderMode, setGenderMode] = useState("predicted");
    const [productsList, setProductsList] = useState(null);
    const [perPage] = useState(20);

    // 🔹 Load data
    useEffect(() => {
        let mounted = true;
        fetchStyle(params.id)
        .then((data) => {
            if (mounted) setStyleData(data);
        })
        .catch((e) => console.error(e));
        return () => (mounted = false);
    }, [params.id, location]);

    // load categories
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const resp = await request.getObjects("api/categories/");
                if (!mounted) return;
                setCategoriesList(resp.data || []);
            } catch (e) {}
        })();
        return () => { mounted = false; };
    }, []);

    function computeEffectiveIsMan() {
        if (genderMode === "male") return true;
        if (genderMode === "female") return false;
        return styleData.user?.is_man || false;
    }

    async function applyFilters() {
        if (!selectedPredict) return;
        const embedding = selectedPredict.image_embedding || selectedPredict.embedding || null;
        // determine category signal: "ALL" => no filter (null), number => category id, null/undefined => predicted
        let useCat = null;
        if (appliedCategoryId === "ALL" || tempCategoryId === "ALL") {
            useCat = null;
        } else if (appliedCategoryId !== null && appliedCategoryId !== undefined) {
            useCat = appliedCategoryId;
        } else if (tempCategoryId !== null && tempCategoryId !== undefined) {
            useCat = tempCategoryId;
        } else {
            useCat = selectedPredict.category?.id || null;
        }

        console.log(isColor);
        let color = null;
        if (isColor){
            color = selectedPredict.color?.id || null;
        }

        const payload = {
            embedding,
            category: useCat,
            color: color,
            is_man: computeEffectiveIsMan(),
            page_n: 1,
            top_n: perPage,
        };
        try {
            const res = await request.saveObject(payload, "api/find_similar_products/");
            // store applied as raw token (ALL or number or null)
            const applied = (tempCategoryId === "ALL") ? "ALL" : (tempCategoryId !== null ? tempCategoryId : appliedCategoryId);
            setAppliedCategoryId(applied);
            setTempCategoryId(null);
            setProductsList(res.data || []);
        } catch (e) {}
    }

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

    // 🔹 Draw connecting lines between predict boxes & crops
    const updatePaths = useCallback(() => {
        if (!styleData || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newPaths = [];

        styleData.predicts.forEach((predict) => {
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

    if (!styleData) return null;

    return (
        <div className="style-page-center">
        <div className={`style-page ${selectedPredict && ((selectedPredict.detected_products?.length || 0) === 0) && !selectedPredict.product ? "no-products" : ""}`} ref={containerRef}>
                {/* 🔹 Left: Main Image */}
                <div className="style-left">
                <div className="image-wrapper">
                    <img
                        ref={containerRef}
                        className="style-image"
                        src={styleData.image_local || styleData.image}
                        alt={styleData.user.username}
                        onLoad={handleImageLoad}
                        onClick={handleImageLoad}
                    />

                    {/* 🔹 Predict boxes with scaling */}
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

                {/* 🔹 Middle: Crops */}
                <div className="style-middle">
                <h4 className="style-middle-title">پیش‌بینی‌ها</h4>
                <div className="crops-list">
                    {styleData.predicts.map((predict) => {
                    const isActive = selectedPredict?.id === predict.id;
                    return (
                        <div
                        key={predict.id}
                        ref={(el) => (cropRefs.current[predict.id] = el)}
                        className={`crop-item ${isActive ? "active" : ""}`}
                        onClick={() =>
                            setSelectedPredict((prev) =>
                            prev?.id === predict.id ? null : predict
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
                        <>
                        <div style={{ marginBottom: 8 }}>
                            <label style={{ display: "block", marginBottom: 6 }}>
                                دسته‌بندی:
                            <select
                                value={ tempCategoryId !== null ? tempCategoryId : (appliedCategoryId !== null ? appliedCategoryId : "") }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "ALL") setTempCategoryId("ALL");
                                    else if (v === "") setTempCategoryId(null);
                                    else setTempCategoryId(Number(v));
                                }}
                                style={{ marginLeft: 8 }}
                            >
                                <option value="">{selectedPredict.category?.title || "پیش‌بینی"}</option>
                                <option value="ALL">همه</option>
                                {categoriesList.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                            </label>
                            <label style={{ display: "inline-block", marginRight: 12 }}>
                                جنسیت:
                                <select value={genderMode} onChange={(e) => setGenderMode(e.target.value)} style={{ marginLeft: 8 }}>
                                    <option value="predicted">{styleData.user?.is_man ? "مرد (جنسیت کاربر)" : "زن (جنسیت کاربر)"}</option>
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
                            <button onClick={applyFilters}>اعمال</button>
                        </div>
                        <div className="products-grid">
                            {/* if productsList set from filter, use it; otherwise fallback to original */}
                            {selectedPredict.product ? (
                                    <div>
                                        <a href={selectedPredict.product.url} target="_blank" rel="noopener noreferrer">
                                            <img className="product-image" src={selectedPredict.product.image_local || selectedPredict.product.image} alt={selectedPredict.product.title} />
                                        </a>
                                        <div className="product-title">{selectedPredict.product.title}</div>
                                        <div className="product-price">
                                            {selectedPredict.product.price ? selectedPredict.product.price.toLocaleString("fa-IR") + " تومان" : ""}
                                        </div>
                                        <hr />
                                    </div>
                                ) : null}
                            { (productsList && productsList.length) ? productsList.map((p) => (
                                <div key={p.id} className="product-card">
                                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                                        <img src={p.image_local || p.image} alt={p.title} />
                                    </a>
                                    <div className="product-title">{p.title}</div>
                                    <div className="product-price">
                                        {p.price ? p.price.toLocaleString("fa-IR") + " تومان" : ""}
                                    </div>
                                    { user.id === styleData.user.id ? 
                                        <div>
                                            <button className="product-button" onClick={() =>addProduct(p, selectedPredict, params.id, styleData, setStyleData)}>انتخاب محصول</button>
                                        </div>
                                    : "" }
                                </div>
                            )) : (
                                <>
                                {selectedPredict.detected_products.map((p) => (
                                    <div key={p.id} className="product-card">
                                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                                            <img src={p.image_local || p.image} alt={p.title} />
                                        </a>
                                        <div className="product-title">{p.title}</div>
                                        <div className="product-price">
                                            {p.price ? p.price.toLocaleString("fa-IR") + " تومان" : ""}
                                        </div>
                                        { user.id === styleData.user.id ? 
                                            <div>
                                                <button className="product-button" onClick={() =>addProduct(p, selectedPredict, params.id, styleData, setStyleData)}>انتخاب محصول</button>
                                            </div>
                                        : "" }
                                    </div>
                                ))}
                                </>
                            )}
                        </div>
                        </>
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

export default MyStyle;