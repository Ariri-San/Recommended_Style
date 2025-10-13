import React from "react";
import Joi from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";




class ImageForm extends Form {
    state = {
        data: { 
            image : null,
        },
        errors: {},
        buttonDisabled: false
    };

    schema = {
        image : Joi.any().label("عکس"),
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">
                    <div class="box-field">
                        {this.renderInput("image", "عکس", "file", "input")}
                    </div>
                        {this.renderButton("اضافه کردن عکس", false, "btn btn-primary")}
                </form>
            </>
        );
    }
}

export default ImageForm;