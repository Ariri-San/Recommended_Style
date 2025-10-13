import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class SellerForm extends Form {
  state = {
    data: {
      name: "",
      image: null,
      address: "",
      national_code: "",
      categories: [],
    },
    selects_data: {
      addresses: [],
      categories: [],
    },
    errors: {},
    buttonDisabled: false,
  };

  schema = {
    name: Joi.string()
      .required()
      .label("نام فروشگاه"),
    image: Joi.any()
      .label("عکس فروشگاه"),
    address: Joi.number()
      .required()
      .label("آدرس فروشگاه"),
    national_code: Joi.number()
      .required()
      .label("کد ملی"),
    categories: Joi.any()
        .label("انواع محصولات"),
  };



  async getData() {
    try{
      const data = (await request.getObjects(this.props.urlForm, this.props.id)).data;
      const image = data.image;
      
      data.categories = data.categories.map(function(item){return item.id});
      data.image = "";
  
      var new_data = this.state.data;
      Object.keys(this.state.data).forEach(function(key, index) {
          if (key in new_data && data[key]){
              new_data[key] = data[key];
          }
      });
      
      this.setState({...this.state, data: new_data, image: image});
    }catch (error) {
      console.log(error)
      toast.error(error.response.data.detail);
      return false
    }
  }

  async getSelectData(url, name_item) {
      try{
          const data = (await request.getObjects(url)).data;
          return data.map(function(item){return {"value": item.id, "name": item[name_item]}});

      } catch{
          return []
      }
  }

  async changeData(){
      var new_selects_data = this.state.selects_data;
      var new_data = this.state.data;

      new_selects_data.categories = await this.getSelectData("shop/categories/", "title");
      new_selects_data.addresses = await this.getSelectData("core/addresses/", "title");
      
      if (!this.state.data.address && new_selects_data.addresses[0]) new_data.address = new_selects_data.addresses[0]["value"]

      this.setState({...this.state, data: new_data, selects_data: new_selects_data});
  }

  async componentDidMount() {
      if (this.props.getData){
          await this.getData();
      }
      this.changeData();
  };


  render() {
    return (
      <form onSubmit={this.handleSubmit} method="post" className="form-small">
        <div className="segment">
          {this.props.id ? <h1>اطلاعات فروشگاه</h1> : <h1>ثبت نام</h1>}
        </div>
        
        <label>
          {this.renderInput("name", "", "text", "input", {placeholder: "نام فروشگاه"})}
        </label>
        <label>
          {this.renderInput("national_code", "", "text", "input", {placeholder: "کد ملی"})}
        </label>
        <label>
          {this.renderSelect("address", "آدرس فروشگاه", "input", this.state.selects_data.addresses)}
        </label>
        <div className="box-field image-upload">
          {this.renderInput("image", "عکس فروشگاه", "file", "input")}
          {this.state.image ? <img className="image-field" src={this.state.image} alt="Image"/> : ""}
        </div>
        <label>
          {this.renderSelect("categories", "انواع محصولات", "input select-multiple", this.state.selects_data.categories, true)}
        </label>

        {this.renderButton("ثبت فروشگاه", this.buttonDisabled, "button red")}
        {/* <p class="mt-3 text-center">آیا قبلا ثبت نام کرده اید؟ <NavLink to="/login">ورود</NavLink></p> */}
      </form>
    );
  }
}

export default SellerForm;
