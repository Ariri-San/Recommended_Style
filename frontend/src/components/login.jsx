import React from "react";
import { useNavigate } from "react-router-dom";
import auth from "../services/authService";
// import { NavLink } from "react-router-dom";
import LoginForm from "./forms/loginForm";



async function doResults(data, results) {
    await auth.loginWithJwt(results.data.access, results.data.refresh);
    window.location = "/";
}



function Login(props) {
    const navigate = useNavigate();
    const url = "auth/jwt/create/";

    return (
        <React.Fragment>
            <div className="box-fields">
                <LoginForm
                    navigate={navigate}
                    onResults={doResults}
                    urlForm={url}
                />
            </div>
        </React.Fragment>
    );
}

export default Login;
