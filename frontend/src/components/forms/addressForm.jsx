import React from "react";
import Joi from "joi-browser";
import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class AddressForm extends Form {
  state = {
    data: {
      title: "",
      phone: "",
      description: "",
      city: "",
      postal_code: "",
    },
    select_data:{
      province: "",
    },
    selects_data: {
      provinces: [],
      cites: [],
    },
    errors: {},
    buttonDisabled: false,
  };

  schema = {
    title: Joi.string()
      .required()
      .label("نام آدرس"),
    phone: Joi.number()
      .required()
      .label("شماره تلفن"),
    description: Joi.string()
      .label("توضیحات آدرس"),
    city: Joi.number()
      .required()
      .label("شهر"),
    postal_code: Joi.number()
      .required()
      .label("کد ملی"),
  };


  customHandleChange = ({ currentTarget: input }) => {
    var value = input.value;
    var select_data = { ...this.state.select_data };

    select_data = this.updateNestedValue(select_data, input.name.split("."), value);
    this.setState({ select_data });
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
      var new_select_data = this.state.select_data;
      var new_data = this.state.data;

      new_selects_data.provinces = await this.getSelectData("core/provinces/", "name");
      if (!this.state.select_data.province && new_selects_data.provinces[0]) new_select_data.province = new_selects_data.provinces[0]["value"];
      this.setState({...this.state, select_data: new_select_data});

      new_selects_data.cites = await this.getSelectData("core/cities/" + this.state.select_data.province + "/", "name");
      if (!this.state.data.city && new_selects_data.cites[0]) new_data.city = new_selects_data.cites[0]["value"];

      this.setState({...this.state, data: new_data, selects_data: new_selects_data});
  }

  async componentDidMount() {
      if (this.props.getData){
          await this.getData();
      }
      this.changeData();
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.select_data.province !== prevState.select_data.province) {
        this.changeData();
    }
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} method="post" className="form-small">
        <div className="segment">
          {this.props.id ? <h1>اطلاعات آدرس {this.state.data.title}</h1> : <h1>ثبت آدرس</h1>}
        </div>
        
        <label>
          {this.renderInput("title", "", "text", "input", {placeholder: "نام آدرس"})}
        </label>
        <label>
          {this.renderInput("phone", "", "text", "input", {placeholder: "شماره تلفن"})}
        </label>
        <label>
          {this.renderInput("description", "", "text", "input", {placeholder: "توضیحات آدرس"})}
        </label>
        <label>
          <label >استان</label>
          <select name="province" id="province" value={this.state.select_data.province} className="input" onChange={this.customHandleChange}>
              {this.state.selects_data.provinces[0] ? this.state.selects_data.provinces.map(option => (
                <option key={option.value} value={option.value} selected={option.value === this.state.select_data.province ? "selected" : ""}>
                    {option.name}
                </option>
              )) : ""}
          </select>
        </label>
        <label>
          {this.renderSelect("city", "شهر", "input", this.state.selects_data.cites)}
        </label>
        <label>
          {this.renderInput("postal_code", "", "text", "input", {placeholder: "کد ملی"})}
        </label>

        {this.renderButton("ثبت آدرس", this.buttonDisabled, "button red")}
      </form>
    );
  }
}

export default AddressForm;
