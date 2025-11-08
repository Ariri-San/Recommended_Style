import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
// import { NavLink } from "react-router-dom";
import DeleteData from '../base/deleteData';
import request from "../services/requestService"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons'
import MyStyleForm from './forms/myStyleForm';


async function doResults(data, results, navigate) {
    navigate("/my_styles/" + results.data.id + "/");
}


function AddStyle(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const url = "api/my_styles/";

    if (props.user) {
        return (
            <div class="row justify-content-center box-fields">
                <div className="segment">
                    <h1>اضافه کردن استایل شخصی</h1>
                </div>
                <MyStyleForm
                        navigate={navigate}
                        urlForm={url}
                        // getData={true}
                        // toPath="/my_styles/"
                        onResults={(data, results) => doResults(data, results, navigate)}
                />
            </div>
        );
    }
}

export default AddStyle;