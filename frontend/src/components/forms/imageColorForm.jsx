import React from "react";
import Joi from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";




class ImageColorForm extends Form {
    state = {
        data: { 
            image : null,
            color: "",
        },
        errors: {},
        buttonDisabled: false
    };

    schema = {
        image : Joi.any().label("عکس"),
        color : Joi.string().label("رنگ"),
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">
                    <div class="box-field image-upload">
                        {this.renderInput("image", "عکس", "file", "input")}
                        {this.renderInput("color", "رنگ", "color", "input color-input")}
                    </div>

                    {this.renderButton("اضافه کردن عکس رنگی", false, "btn btn-primary")}
                </form>
            </>
        );
    }
}

export default ImageColorForm;