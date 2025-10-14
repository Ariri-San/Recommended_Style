import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class UserForm extends Form {
  state = {
      data: {
          height: "",
          weight: "",
          skin_color: "",
          hair_color: "",
          is_show: true,
          image: "",
          email: "",
          birthday: "",
          is_man: null,
      },
      imagePreview: null,
      errors: {},
      buttonDisabled: false,
  };
  
  schema = {
      height: Joi.number()
          .empty("")
          .label("قد"),
      weight: Joi.number()
          .empty("")
          .label("وزن"),
      skin_color: Joi.any()
          .label("رنگ پوست"),
      hair_color: Joi.any()
          .label("رنگ مو"),
      is_show: Joi.boolean()
          .empty("")
          .label("نمایش اطلاعات"),
      image: Joi.any()
          .empty("")
          .label("عکس پروفایل"),
      email: Joi.string()
          .email()
          .empty("")
          .label("ایمیل"),
      birthday: Joi.date()
          .empty("")
          .label("روز تولد"),
      is_man: Joi.any()
          .empty("")
          .label("جنسیت"),
  };

  handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const newData = { ...this.state.data, image: file };

      this.setState({ data: newData, imagePreview: previewUrl });
    }
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
      
      this.setState({
        data: new_data,
        imagePreview: data.image ? data.image : null
      });
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
          {this.renderInput("height", "قد", "number", "input", {placeholder: "cm"})}
        </label>

        <label>
          {this.renderInput("weight", "وزن", "number", "input", {placeholder: "kg"})}
        </label>

        <label>
          {this.renderInput("email", "ایمیل", "text", "input", {placeholder: "ایمیل"})}
        </label>

        <label>
          {this.renderInput("birthday", "تاریخ تولد", "date", "input")}
        </label>

        <div className="box-field">
          <label>عکس پروفایل</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={this.handleImageChange}
          />
          {this.state.imagePreview && (
            <div style={{ marginTop: "10px" }}>
              <img
                src={this.state.imagePreview}
                alt="پیش‌نمایش عکس"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>

        <div className="box-labels">
            <label style={{width:"50%"}}>رنگ پوست</label>
            {this.renderInput("skin_color", "", "color", "input color-input")}
        </div>

        <div className="box-labels">
            <label style={{width:"50%"}}>رنگ مو</label>
            {this.renderInput("hair_color", "", "color", "input color-input")}
        </div>

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

        <div className="box-field checkbox-field" style={{margin: "0px 0px 0px 10px"}}>
          <label className="label-checkbox">آیا میخواهید استایل های شما به بقیه نمایش داده شود؟</label>
          {this.renderInput("is_show","", "checkbox", "custom-checkbox")}
          <h5 style={{margin: "5px"}}>{this.state.data.is_show ? "بله" : "نه"}</h5>
        </div>

        {this.renderButton("تغیر اطلاعات", this.buttonDisabled, "button red")}
      </form>
    );
  }
}

export default UserForm;
