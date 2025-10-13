import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";


class RegisterForm extends Form {
    state = {
        data: {
        username: "",
        password: "",
        email: "",
        is_man: true,
        },
        errors: {},
        buttonDisabled: false,
    };

    schema = {
        username: Joi.string()
        .required()
        .label("نام کاربری"),
        password: Joi.string()
        .required()
        .min(8)
        .label("رمز ورود"),
        email: Joi.string()
        .email()
        .empty("")
        .label("ایمیل"),
        is_man: Joi.any()
        .empty("")
        .label("جنسیت"),
    };

    handleGenderChange = (value) => {
        const data = { ...this.state.data };
        data.is_man = value;
        this.setState({ data });
    };

    render() {
        return (
        <form onSubmit={this.handleSubmit} method="post" className="form-small">
            <div className="segment">
                <h1>ثبت نام</h1>
                <h5 style={{color: "#606060"}}>لطفا برای ثبت نام اطلاعات زیر را پر کنید</h5>
            </div>
            
            <label>
                {this.renderInput("username", "", "text", "input", {placeholder: "نام کاربری"})}
            </label>

            <label>
                {this.renderInput("password", "", "password", "input", {placeholder: "رمز ورود"})}
            </label>

            <label>
                {this.renderInput("email", "", "text", "input", {placeholder: "ایمیل (اختیاری)"})}
            </label>

            {/* <div className="box-field checkbox-field" style={{padding: "0 20px"}}>
                <label className="label-checkbox">جنسیت</label>
                    {this.renderInput("is_man","", "checkbox", "custom-checkbox")}
                <h5 style={{margin: "4px"}}>{this.state.data.is_man ? "مرد" : "زن"}</h5>
            </div> */}

            <div className="box-field radio-field">
                <label className="label-radio">: جنسیت</label>
                <div className="box-labels">
                    <label>
                        <input
                            type="radio"
                            name="is_man"
                            value="true"
                            checked={this.state.data.is_man === true}
                            onChange={() => this.handleGenderChange(true)}
                        />
                        مرد 
                    </label>
                    <label style={{marginRight: "15px"}}>
                        <input
                            type="radio"
                            name="is_man"
                            value="false"
                            checked={this.state.data.is_man === false}
                            onChange={() => this.handleGenderChange(false)}
                        />
                        زن 
                    </label>
                    <label style={{marginRight: "15px"}}>
                        <input
                            type="radio"
                            name="is_man"
                            value="null"
                            checked={this.state.data.is_man === null}
                            onChange={() => this.handleGenderChange(null)}
                        />
                        بدون انتخاب
                    </label>
                </div>
            </div>
            

            {this.renderButton("ثبت نام", this.buttonDisabled, "button red")}
            <p class="mt-3 text-center">آیا قبلا ثبت نام کرده اید؟ <NavLink to="/login">ورود</NavLink></p>
        </form>
        );
    }
}

export default RegisterForm;
