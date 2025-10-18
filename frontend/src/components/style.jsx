import React, {useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
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


async function setData(setState, state, url, id) {
    try {
        const response = await request.getObjects(url, id);
        return setState({ data: response.data });
    } catch (error) {
        if (error.data) request.showError(error);
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
    const containerRef = useRef(null);

    // refs for DOM elements
    const predictRefs = useRef({}); // predictRefs.current[predictId] = el
    const cropRefs = useRef({}); // cropRefs.current[predictId] = el

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
    }, [updatePaths]);

    if (!styleData) return null;

    return (
        <div className="style-page-center"> {/* wrapper to center width (60%) */}
        <div className="style-page" ref={containerRef}>
            {/* left: main image */}
            <div className="style-left">
            <div className="image-wrapper">
                <img
                className="style-image"
                src={styleData.image_local || styleData.image}
                alt={styleData.title}
                onLoad={() => setTimeout(updatePaths, 50)} // ensure layout after image load
                />

                {/* predict boxes (positioned absolute relative to image-wrapper) */}
                {styleData.predicts.map((predict) => {
                const box = predict.bounding_box;
                const isActive = selectedPredict?.id === predict.id;
                return (
                    <div
                    key={predict.id}
                    ref={el => (predictRefs.current[predict.id] = el)}
                    className={`predict-box ${isActive ? "active" : ""}`}
                    style={{
                        left: `${box.x1}px`,
                        top: `${box.y1}px`,
                        width: `${box.x2 - box.x1}px`,
                        height: `${box.y2 - box.y1}px`
                    }}
                    onClick={() => setSelectedPredict(prev => prev?.id === predict.id ? null : predict)}
                    />
                );
                })}
            </div>
            </div>

            {/* middle: crops list */}
            <div className="style-middle">
            <h4>پیش‌بینی‌ها</h4>
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
            <h4>محصولات مشابه</h4>
            {selectedPredict ? (
                <div className="products-grid">
                {selectedPredict.products.map(p => (
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