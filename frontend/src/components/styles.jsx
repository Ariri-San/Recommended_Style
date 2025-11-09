import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import request from "../services/requestService";
import getData from '../services/getData';
import ShowData from '../base/showData';
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import pagination from "../base/functions";



function showStatusGender(is_man){
    if (is_man) return "مرد";
    else return "زن";
}

function colorGender(is_man){
    if (is_man) return "#1672fbff";
    else return "#d000ffff";
}

function showStyles(styles) {
    return styles.results.map(style => (
        <StyleCard key={style.id} style={style} />
    ));
}

function StyleCard({ style }) {
    const [imgSize, setImgSize] = React.useState({
        width: 0,
        height: 0,
        renderedWidth: 0,
        renderedHeight: 0
    });
    const imgRef = React.useRef(null);

    const handleImageLoad = () => {
        if (imgRef.current) {
            setImgSize({
                width: imgRef.current.naturalWidth,
                height: imgRef.current.naturalHeight,
                renderedWidth: imgRef.current.clientWidth,
                renderedHeight: imgRef.current.clientHeight,
            });
        }
    };

    return (
        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
            <div className="team-item">
                <NavLink to={"/styles/" + style.id}>
                    <div className="team-img position-relative overflow-hidden">
                        <img
                            ref={imgRef}
                            onLoad={handleImageLoad}
                            className="img-fluid"
                            src={style.image || style.image_local}
                            alt=""
                        />

                        {/* Bounding Boxes */}
                        <div className="bounding-boxes">
                            {style.predicts.map(pred => {
                                const { x1, y1, x2, y2 } = pred.bounding_box;
                                if (!imgSize.width || !imgSize.renderedWidth) return null;

                                // درصدی کردن مختصات
                                const relX1 = x1 / imgSize.width;
                                const relY1 = y1 / imgSize.height;
                                const relX2 = x2 / imgSize.width;
                                const relY2 = y2 / imgSize.height;

                                // نسبت به ابعاد فعلی عکس
                                const left = relX1 * imgSize.renderedWidth;
                                const top = relY1 * imgSize.renderedHeight;
                                const width = (relX2 - relX1) * imgSize.renderedWidth;
                                const height = (relY2 - relY1) * imgSize.renderedHeight;

                                return (
                                    <div
                                        key={pred.id}
                                        className="bounding-box"
                                        style={{ left, top, width, height }}
                                    >
                                        <span className="bbox-label">{pred.category.title}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* hover info */}
                        {/* <div className="team-social">
                            <h4>id: {style.id}</h4>
                            <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd" />
                        </div> */}
                    </div>
                </NavLink>

                <div className="bg-secondary text-center p-3 text-card">
                    <h5 className="text-uppercase">
                        {style.title.length > 30 ? style.title.substring(0, 30) + "..." : style.title}
                    </h5>
                    <span className="text-primary-2" style={{ color: colorGender(style.is_man) }}>
                        جنسیت : {showStatusGender(style.is_man)}
                    </span>
                    <span className="text-primary-2">تعداد لایک : {style.likes}</span>
                </div>
            </div>
        </div>
    );
}




async function setData(setState, state, url) {
    try {
        const response = await request.getObjects(url);
        return setState({ ...state, data: response.data, show:true });
    } catch (error) {
        if (error.response) request.showError(error);
        return setState({ ...state, show: false });
    }
}



function customSubmit(event, state, setState, location, navigate) {
    event.preventDefault();

    const listFilter = ["search", "ordering", "payment_status"];
    var first = true;
    location.search = "";

    for (const filter of listFilter) {
        if (state[filter]) {
            if (first) {
                location.search += `?${filter}=` + state[filter];
                first = false;
            }
            else location.search += `&${filter}=` + state[filter];
        }
    }

    navigate(location.search);
}  
  


function Styles(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    
    const [state, setState] = useState({
        data: [],
        search: searchParams.get("search"),
        ordering: searchParams.get("ordering"),
        payment_status: searchParams.get("payment_status"),
        show: false
    });


    useEffect(() => {
        setData(setState, state, "api/styles/" + (location.search ? location.search : ""));
    }, [location]);


    if (state.data.results) return (
        <div className="container-xxl py-5">
            <div className="container">
                <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                    <h2 className="d-inline-block bg-secondary text-primary-2 py-1 px-4">سفارشات شما</h2>
                    <form id="search" onSubmit={event => customSubmit(event, state, setState, location, navigate)}>
                        <div class="container h-100">
                            <div class="d-flex justify-content-center h-100">
                                <div class="searchbar">
                                <input
                                    class="search_input"
                                    type="text"
                                    defaultValue={state.search}
                                    onChange={event => setState({ ...state, search: event.target.value })}
                                    placeholder="Type Something"
                                    id="search"
                                    name="search"
                                    onkeypress="handle"
                                />
                                {/* <select
                                    className="select_box"
                                    defaultValue={state.ordering}
                                    id="ordering" name="ordering"
                                    onChange={event => setState({ ...state, ordering: event.target.value })}
                                    >
                                    <option className="option_search" value="order__placed_at">created_at ascending</option>
                                    <option className="option_search" value="-order__placed_at">created_at descending</option>
                                    <option className="option_search" value="order__price_transportation">transportation ascending</option>
                                    <option className="option_search" value="-order__price_transportation">transportation descending</option>
                                    <option className="option_search" value="unit_price">unit_price ascending</option>
                                    <option className="option_search" value="-unit_price">unit_price descending</option>
                                </select> */}
                                {/* <select
                                    className="select_box"
                                    defaultValue={state.payment_status}
                                    id="payment_status" name="payment_status"
                                    onChange={event => setState({ ...state, payment_status: event.target.value })}
                                    >
                                    <option className="option_search" value="">همه موارد</option>
                                    <option className="option_search" value="UP">پرداخت نشده</option>
                                    <option className="option_search" value="PE">در حال بررسی</option>
                                    <option className="option_search" value="PR">درحال انجام</option>
                                    <option className="option_search" value="SN">درحال ارسال</option>
                                    <option className="option_search" value="CO">تمام شده</option>
                                    <option className="option_search" value="FA">کنسل شده</option>
                                    <option className="option_search" value="SE">تسویه شده</option>
                                </select> */}
                                <button class="search_icon"><i class="fas fa-search"></i></button>

                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="row g-4 pb-4">
                    {state.show ? showStyles(state.data) : ""}
                </div>
                {state.show ? pagination(state.data.links, "api/styles/") : ""}
            </div>
        </div>
    );

}

export default Styles;