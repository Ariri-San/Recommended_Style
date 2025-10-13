import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import request from "../services/requestService"
import { toast } from "react-toastify";
import '../css/ticket.css';
import ChatForm from "./forms/chatForm";



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

function showTime(date_time){
    const date = new Date(date_time);
    
    const formattedDate = date.toLocaleString("fa-IR", {
        // year: "numeric",
        // month: "long",
        // day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    return formattedDate
}

async function createChat(state) {
    const response = request.saveObject(null, `make_set/tickets/${state.data.id}/see_tickets/`);
    const results = await response;
    toast.promise(
        response.then(() => new Promise(resolve => setTimeout(resolve, 300))),
        {
            pending: 'Loading...',
            success: { render: "چت ساخته شد", autoClose: 1500 },
            error: `${results.statusText} 🤯`
        }
    );
}

async function closeTicket(url, id, navigate) {
    try{
        const response = request.saveObject({"closed": true}, url, id)
        const results = await response;
    
        toast.promise(
            response.then(() => new Promise(resolve => setTimeout(resolve, 300))),
            {
                pending: 'Loading...',
                success: { render: "تیکت بسته شد", autoClose: 1500 },
                error: `${results.statusText} 🤯`
            }
        );

        navigate("")
    }
    catch (error){
       if (error.response){
            console.log(error)
            if (error.response.data) {
                toast.error(error.response.data["detail"]);
            };
        }
    }
}

async function setData(setState, state, url, id) {
    try {
        const response = await request.getObjects(url, id);
        return setState({ data: response.data });
    } catch (error) {
        if (error.data) request.showError(error);
    }
}


function Ticket(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const url = "make_set/tickets/";
    const [state, setState] = useState({ data: {} });

    useEffect(() => {
        setData(setState, state, url, params.id);
    }, [location]);


    if (props.user) {
        return (
            <div className="container-xxl py-5">
                <div className="container">
                    {state.data.id ?
                        <div className="col-lg-12 pad-top">
                            <div className="detail-boxes">
                                <div className="col-lg-4 detail-box">
                                    : نام کاربر
                                    <div className="detail-value">
                                        {state.data.user.username}
                                    </div>
                                </div>
                                <div className="col-lg-4 detail-box">
                                    : تاریخ ایجاد
                                    <div className="detail-value">
                                        {showDateTime(state.data.created_at)}
                                    </div>
                                </div>
                                <div className="col-lg-4 detail-box">
                                    : وضعیت
                                    <div className="detail-value">
                                        {state.data.closed ? "بسته شده" : "درحال انجام"}
                                    </div>
                                </div>
                                <div className="col-lg-8 detail-box">
                                    : توضیحات
                                    <div className="detail-value">
                                        {state.data.description}
                                    </div>
                                </div>
                                <div className="col-lg-4 detail-box">
                                    : قد
                                    <div className="detail-value">
                                        {state.data.height} cm
                                    </div>
                                </div>
                                <div className="col-lg-4 detail-box">
                                    : وزن
                                    <div className="detail-value">
                                        {state.data.Weight} cm
                                    </div>
                                </div>
                                <div className="col-lg-4 detail-box">
                                    : دور کمر
                                    <div className="detail-value">
                                        {state.data.waist} cm
                                    </div>
                                </div>
                                <div className="col-lg-4 detail-box">
                                    : عرض شانه
                                    <div className="detail-value">
                                        {state.data.shoulder_width} cm
                                    </div>
                                </div>
                            </div>

                            <p></p>
                            <h3 className="title">: تصاویر</h3>
                            <div className="images">
                                <div className="col-lg-3 p-2">
                                    <img className="image" src={state.data.image_1} alt=""/>
                                </div>
                                <div className="col-lg-3 p-2">
                                    <img className="image" src={state.data.image_2} alt=""/>
                                </div>
                                {state.data.image_3 ? 
                                    <div className="col-lg-3 p-2">
                                        <img className="image" src={state.data.image_3} alt=""/>
                                    </div>
                                : ""}
                                {state.data.image_4 ? 
                                    <div className="col-lg-3 p-2">
                                        <img className="image" src={state.data.image_4} alt=""/>
                                    </div>
                                : ""}
                            </div>

                            <div className="total-comments">
                                
                                <>
                                    <h3 className="title">: گفت و گو</h3>
                                    <div className="comments">
                                        {state.data.see_ticket ? state.data.see_ticket.chats.map(function (comment) {
                                            return (
                                                <div className={"comment-box " + (comment.is_seller ? "right" : "left")}>
                                                    <div className={"comment " + (comment.is_seller ? "right" : "left")}>
                                                        <h5 className="name">{comment.is_seller ? ": شما" : ": کاربر" }</h5>
                                                        {comment.product ? 
                                                            <div className="team-item item-comment">
                                                                <NavLink to={"/products/" + comment.product.id}>
                                                                    <div className="team-img position-relative overflow-hidden img-comment">
                                                                        <img className="img-fluid image-comment" src={comment.product.image} alt="" style={{height: "250px"}}/>
                                                                        <div className="team-social shadow-comment">
                                                                            <h4>id: {comment.product.id}</h4>
                                                                            <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                                                                        </div>
                                                                    </div>
                                                                </NavLink>
                                                                <div className="bg-secondary text-center p-4 text-comment">
                                                                    <h5 className="text-uppercase">{comment.product.title}</h5>
                                                                </div>
                                                            </div>
                                                        : ""}
                                                        <p className="text">{comment.text}</p>
                                                        <p className="date">{showTime(comment.created_at)}</p>
                                                    </div>
                                                </div>
                                            );
                                        }) : ""}
                                        {state.data.see_ticket ? !state.data.see_ticket.closed ?
                                            <div>
                                                <ChatForm
                                                    urlForm={`${url}${params.id}/see_tickets/${state.data.see_ticket.id}/chats/`}
                                                    navigate={navigate}
                                                    />
                                                <div className="closing-ticket">
                                                    <button onClick={() => closeTicket(`${url}${params.id}/see_tickets/`, state.data.see_ticket.id, navigate)}>بستن تیکت</button>
                                                </div>
                                            </div>
                                            : ""
                                        :
                                            <ChatForm
                                                urlForm={`${url}${params.id}/see_tickets/`}
                                                navigate={navigate}
                                                create_seeTicket={true}
                                            />
                                        }
                                        
                                    </div>
                                </>
                                    {/* : <button className="button red-small" onClick={() => createChat(state)}>شروع گفت و گو</button>} */}
                            </div>
                        </div>
                    : ""}
                </div>
            </div>
        );
    }
}

export default Ticket;