import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import request from "../services/requestService";
import getData from '../services/getData';
import ShowData from '../base/showData';
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';




function showAddress(item) {
    return (
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                <NavLink to={"/address/" + item.id}>
                    <div className="team-item">
                        <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                            <h5 className="text-uppercase">{item.title}</h5>
                            <span className="text-primary-2">استان : {item.city.province.name}</span>
                            <span className="text-primary-2">شهر : {item.city.name}</span>
                        </div>
                    </div>
                </NavLink>
            </div>
    );
}


function showAddresses(items) {
    return items.map(item => showAddress(item));
}



async function setData(setState, state, url) {
    try {
        const response = await request.getObjects(url);
        return setState({ data: response.data });
    } catch (error) {
        if (error.data) request.showError(error);
        // return setState({ show: false });
    }
}



function Addresses(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const [state, setState] = useState({ data: [] });


    useEffect(() => {
        setData(setState, state, "core/addresses/");
    }, [location]);



    if (state.data)
        return (
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                        <h2 className="d-inline-block bg-secondary text-primary-2 py-1 px-4">آدرس های شما</h2>
                    </div>

                    <div className="row g-4">
                        {showAddresses(state.data)}
                    </div>
                </div>
            </div>
    );

}

export default Addresses;