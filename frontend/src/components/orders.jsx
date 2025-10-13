import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import request from "../services/requestService";
import getData from '../services/getData';
import ShowData from '../base/showData';
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import pagination from "../base/functions";



function showStatusPayment(payment_status){
    if (payment_status === "UP") return "پرداخت نشده";
    else if (payment_status === "PE") return "در حال بررسی";
    else if (payment_status === "PR") return "درحال انجام";
    else if (payment_status === "SN") return "درحال ارسال";
    else if (payment_status === "CO") return "تمام شده";
    else if (payment_status === "FA") return "کنسل شده";
    else if (payment_status === "SE") return "تسویه شده";
    else return "";
}

function colorPaymentStatus(payment_status){
    if (payment_status === "UP") return "#7d7d7dbd";
    else if (payment_status === "PE") return "rgb(22 101 251)";
    else if (payment_status === "PR") return "#ffb500";
    else if (payment_status === "SN") return "rgb(251 22 193)";
    else if (payment_status === "CO") return "#5dff00";
    else if (payment_status === "FA") return "#fb1616";
    else if (payment_status === "SE") return "rgb(13 237 227)";
    else return "";
}


function showOrders(orders) {
    return orders.results.map(order => 
        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
            <div className="team-item">
                <NavLink to={"/orders/" + order.id}>
                    <div className="team-img position-relative overflow-hidden">
                        <img className="img-fluid" src={order.items[0].product.image} alt=""/>
                        <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                            <h4>id: {order.id}</h4>
                            <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                        </div>
                    </div>
                </NavLink>
                <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                    <h5 className="text-uppercase">{order.order.address.city.name}</h5>
                    <span className="text-primary-2" style={{color: colorPaymentStatus(order.payment_status)}}>وضعیت : {showStatusPayment(order.payment_status)}</span>
                    <span className="text-primary-2">تعداد : {order.items.length}</span>
                    <span className="text-primary-2">هزینه ارسال : {order.price_transportation}</span>
                    <span className="text-primary-2">میزان درآمد : {order.total_profit}</span>
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
  


function Orders(props) {
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
        setData(setState, state, "shop/seller_orders/" + (location.search ? location.search : ""));
    }, [location]);


    if (props.user) return (
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
                </div>

                <div className="row g-4">
                    {state.show ? showOrders(state.data) : ""}
                </div>
                {state.show ? pagination(state.data.links, "shop/seller_orders/") : ""}
            </div>
        </div>
    );
    else navigate("/login");

}

export default Orders;