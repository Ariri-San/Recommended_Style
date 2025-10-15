import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
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
    return styles.results.map(style => 
        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
            <div className="team-item">
                <NavLink to={"/styles/" + style.id}>
                    <div className="team-img position-relative overflow-hidden">
                        <img className="img-fluid" src={style.image} alt=""/>
                        <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                            <h4>id: {style.id}</h4>
                            <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                        </div>
                    </div>
                </NavLink>
                <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                    <h5 className="text-uppercase">{style.title.length > 30 ? style.title.substring(0, 30) + "..." : style.title}</h5>
                    <span className="text-primary-2" style={{color: colorGender(style.is_man)}}>جنسیت : {showStatusGender(style.is_man)}</span>
                    <span className="text-primary-2">تعداد لایک : {style.likes}</span>
                    {/* <span className="text-primary-2">هزینه ارسال : {style.price_transportation}</span>
                    <span className="text-primary-2">میزان درآمد : {style.total_profit}</span> */}
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
                {/* <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
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
                                <select
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
                                </select>
                                <select
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
                                </select>
                                <button class="search_icon"><i class="fas fa-search"></i></button>

                                </div>
                            </div>
                        </div>
                    </form>
                </div> */}

                <div className="row g-4 pb-4">
                    {state.show ? showStyles(state.data) : ""}
                </div>
                {state.show ? pagination(state.data.links, "api/styles/") : ""}
            </div>
        </div>
    );

}

export default Styles;