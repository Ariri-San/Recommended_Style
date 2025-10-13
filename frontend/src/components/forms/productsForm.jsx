import React from "react";
import Joi, { errors } from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class ProductsForm extends Form {
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

        new_selects_data.discounts.push({value: 0, "name": "بدون تغییر"});
        new_selects_data.discounts.push({value: "", "name": "بدون تخفیف"});
        (await request.getObjects("shop/discounts/")).data.map(item => new_selects_data.discounts.push({"value": item.id, "name": item["title"]}));

        this.setState({...this.state, data: new_data, selects_data: new_selects_data});
    }

    async componentDidMount() {
        await this.changeData();
    };

    componentDidUpdate(prevProps) {
        if (this.props.products !== prevProps.products) {
            const state = this.state;
            this.setState({...state, data: {...state.data, products: this.props.selected_products}, selects_data: {...state.selects_data, products: this.props.products}});
        }
    };

    handleGenderChange = (value) => {
        const data = { ...this.state.data };
        data.is_show = value;
        this.setState({ data });
    };

    state = {
        data: {
            products: this.props.selected_products,
            coefficient_price : "1",
            discount : "0",
            is_show: null
        },
        selects_data: {
            discounts: [],
            products: this.props.products
        },
        errors: {},
        buttonDisabled: false,
    };

    schema = {
        products: Joi.any().label("محصولات"),
        coefficient_price : Joi.number().label("ضریب قیمت محصولات"),
        discount : Joi.any().label("تخفیف ها"),
        is_show: Joi.any().label("قابل دیدن"),
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">
                    <div className="box-field">
                        {this.renderInput("coefficient_price", "ضریب قیمت محصولات", "number", "input text-center", {step: ".01"})}
                    </div>

                    <div className="box-field">
                        {this.renderSelect("discount", "تخفیف", "input", this.state.selects_data.discounts)}
                    </div>

                    {/* <div className="box-field checkbox-field">
                        <label className="label-checkbox">دیدن محصول ؟</label>
                        {this.renderInput("is_show", "", "checkbox", "custom-checkbox")}
                    </div> */}
                    <div className="box-field radio-field">
                        <label className="label-radio">آیا میخواهید محصولات قابل دیدن یا غیرقابل دیدن شوند؟</label>
                        <div className="box-labels">
                            <label>
                                <input
                                    type="radio"
                                    name="is_show"
                                    value="true"
                                    checked={this.state.data.is_show === true}
                                    onChange={() => this.handleGenderChange(true)}
                                />
                                قابل دیدن 
                            </label>
                            <label style={{marginRight: "15px"}}>
                                <input
                                    type="radio"
                                    name="is_show"
                                    value="false"
                                    checked={this.state.data.is_show === false}
                                    onChange={() => this.handleGenderChange(false)}
                                />
                                غیرقابل دیدن 
                            </label>
                            <label style={{marginRight: "15px"}}>
                                <input
                                    type="radio"
                                    name="is_show"
                                    value="null"
                                    checked={this.state.data.is_show === null}
                                    onChange={() => this.handleGenderChange(null)}
                                />
                                بدون تغییر 
                            </label>
                        </div>
                    </div>

                    {this.renderButton("تغییر محصولات", false, "button red-small")}
                </form>
            </>
        );
    }
}

export default ProductsForm;