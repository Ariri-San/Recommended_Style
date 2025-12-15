import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTShirt } from '@fortawesome/free-solid-svg-icons'


function listen_scroll(state, setState){
    if (window.scrollY > 400){
        setState({scroll_up: false, show_menu: state.show_menu});
    }
    else {
        setState({scroll_up: true, show_menu: state.show_menu});
    }
}


function Navbar({ user }) {
    const [state, setState] = useState({scroll_up: true, show_menu: false, dropdown_open: false});

    window.addEventListener("scroll", () => listen_scroll(state, setState));

    return (
            <nav className={"navbar navbar-expand-lg navbar-dark sticky-top py-lg-0 px-lg-5 wow fadeIn"} style={{position: (state.scroll_up ?  "relative" :  "sticky"), top: 0}} data-wow-delay="0.1s">
                <NavLink to="/" className="navbar-brand ms-4 ms-lg-0">
                    <h1 className="mb-0 text-primary-2 text-uppercase"><FontAwesomeIcon icon={faTShirt}/> IStyle</h1>
                </NavLink>
                <button type="button" className="navbar-toggler me-4" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" onClick={() => setState({show_menu: !state.show_menu})}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarCollapse" style={{display: state.show_menu ? "block" : "none"}}>
                    <div className="navbar-nav ms-auto p-4 p-lg-0">
                        <NavLink to="/" className="nav-item nav-link">Home</NavLink>
                        <NavLink to="/products" className="nav-item nav-link">Products</NavLink>
                        <NavLink to="/styles" className="nav-item nav-link">Styles</NavLink>
                        {user ? <NavLink to="/recommended" className="nav-item nav-link">Recommended System</NavLink> : ""}
                        <div className="nav-item dropdown">
                            <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" onClick={() => setState({...state, dropdown_open: !state.dropdown_open})}>Account</div>
                            <div className="dropdown-menu m-0" style={{display: state.dropdown_open ? "block" : ""}}>
                                {user ? <NavLink to="/my_styles" className="dropdown-item">My Styles</NavLink> : ""}
                                {user ? <NavLink to="/add_style" className="dropdown-item">Add Style</NavLink> : ""}
                                {user ? <NavLink to="/user" className="dropdown-item">Profile</NavLink> : <NavLink className="dropdown-item" to="/register">Sign Up</NavLink>}
                                {user ? <NavLink className="dropdown-item" to="/logout"> Logout</NavLink> : <NavLink className="dropdown-item " to="/login">Login</NavLink>}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        // </header>

    );
}

export default Navbar;