import React from "react";
import Joi, { errors } from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class MyStyleForm extends Form {
    state = {
        data: { 
            image : null,
        },
        errors: {},
        buttonDisabled: false,
    };

    schema = {
        image : Joi.any().label("عکس"),
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">

                    <div className="box-field image-upload">
                        {this.renderInput("image", "عکس", "file", "input")}
                        {this.state.image ? <img className="image-field" src={this.state.image} alt="Image"/> : ""}
                    </div>

                    {this.renderButton("ارسال عکس", false, "button red-small")}
                </form>
            </>
        );
    }
}

export default MyStyleForm;