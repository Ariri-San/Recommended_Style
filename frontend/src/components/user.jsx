import React, {useState, useEffect} from "react";
import { useNavigate, useLocation } from "react-router";
import auth from "../services/authService.js";
// import { NavLink } from "react-router-dom";
import UserForm from "./forms/userForm.jsx";


function User(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const url = "auth/users/";


    if (props.user) return (
        <React.Fragment>
            <div className="box-fields">
                <UserForm
                    navigate={navigate}
                    urlForm={url}
                    getData={props.user ? true : false}
                    id={props.user ? props.user.id : ""}
                />
            </div>
        </React.Fragment>
    );
}

export default User;
