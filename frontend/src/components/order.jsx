import React, {useState, useEffect} from "react";
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



async function setData(setState, state, url, id) {
    try {
        const response = await request.getObjects(url, id);
        return setState({ data: response.data });
    } catch (error) {
        if (error.data) request.showError(error);
    }
}


function Order(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const url = "shop/seller_orders/";
    const [state, setState] = useState({ data: {} });

    useEffect(() => {
        setData(setState, state, url, params.id);
    }, [location]);


    if (props.user) {
        return (
            <div className="container-xxl py-5">
                <div className="container">
                    {state.data.id ?
                        <>
                            <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                                <div className="col-lg-12 col-md-12 wow fadeInUp" data-wow-delay="0.3s">
                                    <h1>آدرس</h1>
                                    <p></p>
                                    <h3>استان : {state.data.order.address.city.province.name}</h3>
                                    <h3>شهر : {state.data.order.address.city.name}</h3>
                                    <h3>کد پستی : {state.data.order.address.postal_code}</h3>
                                    <h3>شماره موبایل گیرنده : {state.data.order.address.phone.replace("+98", "0")}</h3>
                                    <h3>آدرس دقیق : {state.data.order.address.description}</h3>
                                    <p></p>
                                    <h2>تاریخ ثبت سفارش: {showDateTime(state.data.order.placed_at)}</h2>
                                    <p></p>
                                    <h2>وضعیت سفارش کلی : <span style={{color: colorPaymentStatus(state.data.order.payment_status)}}>{showStatusPayment(state.data.order.payment_status)}</span></h2>
                                    <h2>وضعیت سفارش : <span style={{color: colorPaymentStatus(state.data.payment_status)}}>{showStatusPayment(state.data.payment_status)}</span></h2>
                                    <p></p>
                                    <h3>درآمد کلی از سفارش: {state.data.total_profit}</h3>
                                </div>
                            </div>
                            <div className="row g-4">
                                {state.data.items.map(item => 
                                    <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                                        <div className="team-item">
                                            <div className="team-img position-relative overflow-hidden">
                                                <img className="img-fluid" src={item.product.image} alt=""/>
                                                <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                                                    <h5>{item.product.is_man ? "مردانه" : "زنانه"}</h5>
                                                    <h5>آیدی محصول: {item.product.id}</h5>
                                                    <h5>قیمت : {item.unit_price}</h5>
                                                    <h5>تعداد لایک : {item.product.likes}</h5>
                                                    <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                                                </div>
                                            </div>
                                            <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                                                <h5 className="text-uppercase">{item.product.title}</h5>
                                                <span className="text-primary-2">تعداد : {item.quantity}</span>
                                                <span className="text-primary-2">رنگ : {item.color.title}</span>
                                                <span className="text-primary-2">اندازه : {item.size.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    : ""}
                </div>
            </div>
        );
    }
}

export default Order;