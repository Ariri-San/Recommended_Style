import React from "react";
import { useNavigate } from "react-router";
import auth from "../services/authService";
// import { NavLink } from "react-router-dom";
import RegisterForm from "./forms/registerForm";


async function doResults(data, results) {
    await auth.login(data.username, data.password);
    window.location = "/seller";
}


function Register(props) {
    const navigate = useNavigate();
    const url = "core/users/";

    return (
        <React.Fragment>
            <div className="box-fields">
                <RegisterForm
                    navigate={navigate}
                    onResults={doResults}
                    urlForm={url}
                />
            </div>
        </React.Fragment>
    );
}

export default Register;
