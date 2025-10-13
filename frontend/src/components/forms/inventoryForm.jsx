import React from "react";
import Joi from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";




class InventoryForm extends Form {
    state = {
        data: { 
            number: this.props.number,
            color : this.props.color_id,
            size : this.props.size_id,
        },
        errors: {},
        buttonDisabled: false
    };

    schema = {
        number : Joi.number().label("موجودی"),
        color : Joi.number().label("رنگ"),
        size : Joi.number().label("اندازه"),
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.state.data.color !== this.props.color_id || this.state.data.size !== this.props.size_id) {
            this.setState({data: {number: this.props.number, color : this.props.color_id, size : this.props.size_id}})
        }
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">
                    <div class="box-field">
                        {this.renderInput("number", "موجودی", "text", "input")}
                    </div>
                        {this.renderButton("تغیر", false, "btn btn-primary")}
                </form>
            </>
        );
    }
}

export default InventoryForm;