import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";


class RegisterForm extends Form {
  state = {
    data: {
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      phone: "",
      email: "",
      age: "",
      is_man: true,
    },
    errors: {},
    buttonDisabled: false,
  };

  schema = {
    first_name: Joi.string()
      .required()
      .label("نام"),
    last_name: Joi.string()
      .required()
      .label("نام خانوادگی"),
    username: Joi.string()
      .required()
      .label("نام کاربری"),
    password: Joi.string()
      .required()
      .min(8)
      .label("رمز ورود"),
    phone: Joi.string()
        .required()
        .min(13)
        .max(13)
        .label("شماره موبایل"),
    email: Joi.string()
      .email()
      .empty("")
      .label("ایمیل"),
    age: Joi.number()
      .empty("")
      .label("سن"),
    is_man: Joi.boolean()
      .empty("")
      .label("جنسیت"),
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} method="post" className="form-small">
        <div className="segment">
          <h1>ثبت نام</h1>
          <h5 style={{color: "#606060"}}>لطفا برای ثبت نام اطلاعات زیر را پر کنید</h5>
        </div>
        
        <label>
          {this.renderInput("first_name", "", "text", "input", {placeholder: "نام"})}
        </label>
        <label>
          {this.renderInput("last_name", "", "text", "input", {placeholder: "نام خانوادگی"})}
        </label>
        <label>
          {this.renderInput("username", "", "text", "input", {placeholder: "نام کاربری"})}
        </label>
        <label>
          {this.renderInput("phone", "", "text", "input", {placeholder: "شماره موبایل"})}
        </label>
        <label>
          {this.renderInput("password", "", "password", "input", {placeholder: "رمز ورود"})}
        </label>
        <label>
          {this.renderInput("email", "", "text", "input", {placeholder: "ایمیل (اختیاری)"})}
        </label>
        <label>
          {this.renderInput("age", "", "text", "input", {placeholder: "سن (اختیاری)"})}
        </label>
        <div className="box-field checkbox-field" style={{padding: "0 20px"}}>
          <label className="label-checkbox">جنسیت</label>
          {this.renderInput("is_man","", "checkbox", "custom-checkbox")}
          <h5 style={{margin: "4px"}}>{this.state.data.is_man ? "مرد" : "زن"}</h5>
        </div>

        {this.renderButton("ثبت نام", this.buttonDisabled, "button red")}
        <p class="mt-3 text-center">آیا قبلا ثبت نام کرده اید؟ <NavLink to="/login">ورود</NavLink></p>
      </form>
    );
  }
}

export default RegisterForm;
