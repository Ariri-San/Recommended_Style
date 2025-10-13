import React, {useState, useEffect} from "react";
import { useNavigate, useLocation } from "react-router";
import auth from "../services/authService";
// import { NavLink } from "react-router-dom";
import SellerForm from './forms/sellerForm';
import request from "../services/requestService.js";


async function doResults(data, results) {
    window.location = "/";
}


async function setData(setState, state, url) {
    try {
        const response = await request.getObjects(url);
        return setState({ data: response.data, change:true });
    } catch (error) {
        if (error.data) request.showError(error);
        return setState({ show: false });
    }
}


function Seller(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const url = "shop/sellers/";
    const [state, setState] = useState({ data: [], change: false});


    useEffect(() => {
        setData(setState, state, url);
    }, [location]);
    

    if (props.user && state.change) return (
        <React.Fragment>
            <div className="box-fields">
                <SellerForm
                    navigate={navigate}
                    onResults={doResults}
                    urlForm={url}
                    getData={state.data[0] ? true : false}
                    id={state.data[0] ? state.data[0].id : ""}
                />
            </div>
        </React.Fragment>
    );
}

export default Seller;
