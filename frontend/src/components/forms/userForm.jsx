import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class UserForm extends Form {
    state = {
        data: {
            first_name: "",
            last_name: "",
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




  async getData() {
    try{
      const data = (await request.getObjects(this.props.urlForm, this.props.id)).data;

      var new_data = this.state.data;
      Object.keys(this.state.data).forEach(function(key, index) {
          if (key in new_data && data[key]){
              new_data[key] = data[key];
          }
      });
      
      this.setState({...this.state, data: new_data});
    }catch (error) {
      console.log(error)
      toast.error(error.response.data.detail);
      return false
    }
  }

  async componentDidMount() {
      if (this.props.getData){
          await this.getData();
      }
  };


  render() {
    return (
      <form onSubmit={this.handleSubmit} method="post" className="form-small">
        <div className="segment">
          <h1>اطلاعات کاربر</h1>
        </div>
        
        <label>
          {this.renderInput("first_name", "", "text", "input", {placeholder: "نام"})}
        </label>
        <label>
          {this.renderInput("last_name", "", "text", "input", {placeholder: "نام خانوادگی"})}
        </label>
        <label>
          {this.renderInput("phone", "", "text", "input", {placeholder: "شماره موبایل"})}
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

        {this.renderButton("تغیر اطلاعات", this.buttonDisabled, "button red")}
      </form>
    );
  }
}

export default UserForm;
