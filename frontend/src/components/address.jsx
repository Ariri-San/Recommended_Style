import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import request from "../services/requestService.js";
import AddressForm from "./forms/addressForm.jsx";


async function doResults(data, results) {
    window.location = "/addresses";
}



function Address(props) {
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();
    const url = "core/addresses/";


    if (props.user) return (
        <React.Fragment>
            <div className="box-fields">
                <AddressForm
                    navigate={navigate}
                    onResults={doResults}
                    urlForm={url}
                    getData={params ? true : false}
                    id={params ? params.id : ""}
                />
            </div>
        </React.Fragment>
    );
}

export default Address;
