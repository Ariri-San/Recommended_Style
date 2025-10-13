import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";


class LoginForm extends Form {
  state = {
    data: {
      username: "",
      password: "",
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
      .label("رمز ورود")
  };


  render() {
    return (
      <form onSubmit={this.handleSubmit} method="post" className="form-small">
        <div className="segment">
          <h1>ورود به پنل فروشگاه</h1>
        </div>
        
        <label>
          {this.renderInput("username", "", "text", "input", {placeholder: "نام کاربری"})}
        </label>
        <label>
          {this.renderInput("password", "", "password", "input", {placeholder: "رمز ورود"})}
        </label>
        {this.renderButton("ورود", this.buttonDisabled, "button red")}
        <p className="mt-3 text-center">آیا ثبت نام نکرده اید؟ <NavLink to="/register">ثبت نام</NavLink></p>
      </form>
    );
  }
}

export default LoginForm;
