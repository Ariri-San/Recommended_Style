import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import request from "../services/requestService.js";
import config from "../config.json";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import "../css/tickets.css";
import { toast } from "react-toastify";

const base_url = config.BaseUrl;


function formatDate(isoString) {
    const date = new Date(isoString);
    return format(date, "yyyy/MM/dd HH:mm:ss");
}

function showDateTime(date_time){
    const date = new Date(date_time);
    
    const formattedDate = date.toLocaleString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        // hour: "2-digit",
        // minute: "2-digit",
    });
    return formattedDate
}

function changeUrlPagination(url, url_objects) {
    return url
        ? url.replace(base_url.replace("https", "http") + url_objects, "")
        : "";
}
function pagination(data, url_objects) {
    return (
        <div className="pagination-box">
            <ul className="pagination">
                <li className="page-item">
                    <NavLink
                        className={
                            data.previous
                                ? "page-link"
                                : "page-link disabled"
                        }
                        to={changeUrlPagination(data.previous, url_objects)}
                    >
                        Previous
                    </NavLink>
                </li>
                <li className="page-item">
                    <NavLink
                        className={
                            data.next ? "page-link" : "page-link disabled"
                        }
                        to={changeUrlPagination(data.next, url_objects)}
                    >
                        Next
                    </NavLink>
                </li>
            </ul>
        </div>
    );
}

function showSeeTickets(data) {
    return data.results.map((item) => 
        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
            <div className="team-item">
                <NavLink to={"/tickets/" + item.ticket.id}>
                    <div className="team-img position-relative overflow-hidden">
                        <img className="img-fluid" src={item.ticket.image_1} alt=""/>
                        <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                            <h4>id: {item.ticket.id}</h4>
                            <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                        </div>
                    </div>
                </NavLink>
                <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                    <h5 className="text-uppercase">{item.ticket.user.username}</h5>
                    <span className="text-primary-2">تاریخ : {showDateTime(item.ticket.created_at)}</span>
                </div>
            </div>
        </div>
    );
}

function showTickets(data) {
    return data.results.map((item) => 
        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
            <div className="team-item">
                <NavLink to={"/tickets/" + item.id}>
                    <div className="team-img position-relative overflow-hidden">
                        <img className="img-fluid" src={item.image_1} alt=""/>
                        <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                            <h4>id: {item.id}</h4>
                            <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                        </div>
                    </div>
                </NavLink>
                <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                    <h5 className="text-uppercase">{item.user.username}</h5>
                    <span className="text-primary-2">تعداد فروشگاه هایی که پاسخ دادن: {item.num_see_tickets}</span>
                    <span className="text-primary-2">تاریخ : {showDateTime(item.created_at)}</span>
                </div>
            </div>
        </div>
    );
}


function customSubmit(event, state, setState, location, navigate) {
    event.preventDefault();

    const listFilter = ["search", "ordering", "page"];
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
    setState({ ...state, show: false });
}  

async function setData(setState, state, location) {
    try {
        const response = await request.getObjects("make_set/tickets/" + (location.search? (location.search + "&closed=false") : "?closed=false"));
        const see_tickets = await request.getObjects("make_set/see_tickets_seller/" + (location.search? (location.search + "&closed=false") : "?closed=false"));
        const closed_see_tickets = await request.getObjects("make_set/see_tickets_seller/" + (location.search? (location.search + "&closed=true") : "?closed=true"));

        return setState({
            ...state,
            data: response.data,
            see_tickets: see_tickets.data,
            closed_see_tickets: closed_see_tickets.data,
            show: true
        });
    } catch(error) {
        if (error.response) request.showError(error);
        return setState({ show: false });
    }
}

const Tickets = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [state, setState] = useState({ data: [], deputies: null, show: false });
    
    useEffect(() => {
        setData(
            setState,
            state,
            location
        );
    }, [location.search]);
    
    if (user) {
        return (
            <main className="base-data">
                <div className="container-xxl py-5">
                    {state.show ? (
                        <>
                            <div className="container box-tickets">
                                <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                                    <h2 className="d-inline-block bg-secondary text-primary-2 py-1 px-4 w-50">تیکت های دیده نشده</h2>
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
                                                    <option className="option_search" value="">Nothing</option>
                                                    <option className="option_search" value="created_at">created_at ascending</option>
                                                    <option className="option_search" value="-created_at">created_at descending</option>
                                                </select>
                                                <button class="search_icon"><i class="fas fa-search"></i></button>

                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                {state.data.count > 0 ? 
                                    <div className="row g-4">
                                        {showTickets(state.data)}
                                        {pagination(state.data, "make_set/tickets/")}
                                    </div>
                                : <h2 className="text-center">بدون تیکت</h2> }
                            </div>
                            
                            <div className="container box-tickets">
                                <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                                    <h2 className="d-inline-block bg-secondary text-primary-2 py-1 px-4 w-50">تیکت های فعال شما</h2>
                                </div>
                                {state.see_tickets.count > 0 ? 
                                    <div className="row g-4">
                                        {showSeeTickets(state.see_tickets)}
                                        {pagination(state.data, "make_set/tickets/")}
                                    </div>
                                : <h2 className="text-center">بدون تیکت</h2> }
                            </div>

                            <div className="container box-tickets">
                                <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                                    <h2 className="d-inline-block bg-secondary text-primary-2 py-1 px-4 w-50">تیکت های تمام شده شما</h2>
                                </div>

                                {state.closed_see_tickets.count > 0 ? 
                                    <div className="row g-4">
                                        {showSeeTickets(state.closed_see_tickets)}
                                        {pagination(state.data, "make_set/tickets/")}
                                    </div>
                                : <h2 className="text-center">بدون تیکت</h2> }
                            </div>
                        </>
                    ) : (
                        <div className="container" style={{ justifyContent: "center" }}>
                            <h3>در حال بارگذاری ...</h3>
                        </div>
                    )}
                </div>
            </main>
        );
    } else navigate("/login");
};

export default Tickets;
