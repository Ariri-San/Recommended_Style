import React from "react";
import Joi, { errors } from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";
import InventoryForm from "./inventoryForm.jsx";




class ProductForm extends Form {
    async getData() {
        try{
            const data = (await request.getObjects(this.props.urlForm, this.props.id)).data;
            const image = data.image;

            var new_temp_data = this.state.temp_data;
            new_temp_data.specification_keys = data.specifications.map(function(item){return item.key.id});
            
            data["category"] = data.category.id;
            data.sizes = data.sizes.map(function(item){return item.id});
            data.colors = data.colors.map(function(item){return item.id});
            data.specifications = data.specifications.map(function(item){return item.id});
            data.image = "";
    
            var new_data = this.state.data;
            Object.keys(this.state.data).forEach(function(key, index) {
                if (key in new_data && data[key]){
                    new_data[key] = data[key];
                }
            });

            new_data.discount = data.discount ? data.discount.id : null;

            this.setState({...this.state, data: new_data, temp_data: new_temp_data, image: image});
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
        new_selects_data.colors = await this.getSelectData("shop/colors/", "title"); 
        
        if (!this.state.data.category && new_selects_data.categories[0]) new_data.category = new_selects_data.categories[0]["value"];

        new_selects_data.sizes = await this.getSelectData("shop/sizes/" + (this.state.data.category ? "?category_id=" + this.state.data.category : ""), "title");
        try{
            const specification_keys = (await request.getObjects("shop/specification_keys/" + (this.state.data.category ? "?category_id=" + this.state.data.category : ""))).data;
            new_selects_data.specification_keys = specification_keys.map(function(item){return {"value": item.id, "name": item["title"], "description": item["description"]}})
            
            for (let index = 0; index < specification_keys.length; index++) {
                new_selects_data.specifications[specification_keys[index].id] = specification_keys[index].specifications.map(function(item){return {"value": item.id, "name": item["value"]}});
            }
        }catch{
            new_selects_data.specification_keys = [];
        }
        new_selects_data.discounts.push({value: "", "name": "بدون تخفیف"});
        (await request.getObjects("shop/discounts/")).data.map(item => new_selects_data.discounts.push({"value": item.id, "name": item["title"]}));

        this.setState({...this.state, data: new_data, selects_data: new_selects_data});
    }


    async componentDidMount() {
        if (this.props.getData){
            await this.getData();
        }
        this.changeData();
    };
    
    componentDidUpdate(prevProps, prevState) {
        if (this.state.data.category !== prevState.data.category) {
            this.changeData();
        }
    };

    handleGenderChange = (value) => {
        const data = { ...this.state.data };
        data.is_man = value;
        this.setState({ data });
    };

    handleTempSelectChange = ({ currentTarget: input }) => {
        const temp_data = { ...this.state.temp_data };
        const data = { ...this.state.data };

        temp_data[input.name] = []
        var options = input.options;

        for (var i=0; i<options.length; i++) {
            if (options[i].selected){
                temp_data[input.name].push(Number(options[i].value));
                if (!this.state.selects_data.specifications[options[i].value].find(spec => this.state.data.specifications.find(id => id === spec.value)))
                    data.specifications.push(Number(this.state.selects_data.specifications[options[i].value][0].value));
            } 
            else if (this.state.selects_data.specifications[options[i].value].find(spec => this.state.data.specifications.find(id => id === spec.value))){
                const index = data.specifications.indexOf(this.state.selects_data.specifications[options[i].value].find(spec => this.state.data.specifications.find(id => id === spec.value)).value);
                data.specifications.splice(index, 1);
            };
        }
        
        this.setState({ temp_data, data });
    };

    handleSelectChange = ({ currentTarget: input }) => {
        const data = { ...this.state.data };
        const options = input.options;

        for (var i=0; i<options.length; i++) {
            if (data[input.name].find(id => id === Number(options[i].value))){
                const index = data[input.name].indexOf(data[input.name].find(id => id === Number(options[i].value)));
                data[input.name].splice(index, 1);
            };
        }

        data[input.name].push(Number(input.value))
        this.setState({ data });
    };

    state = {
        data: { 
            title : "",
            category : null,
            is_man : null,
            sizes : [],
            description : "",
            unit_price : 1000,
            specifications : [],
            image : null,
            colors: [],
            discount : "",
            is_show: null
        },
        temp_data: {
            specification_keys: [],
        },
        selects_data: {
            categories: [],
            sizes: [],
            colors: [],
            specifications : {},
            specification_keys : [],
            discounts : []
        },
        dataFormData: {
            image: null,
        },
        errors: {},
        buttonDisabled: false,
        image: null
    };

    schema = {
        title : Joi.string().label("اسم محصول"),
        category : Joi.any().label("نوع محصول"),
        is_man : Joi.any().label("جنسیت"),
        sizes : Joi.any().label("اندازه ها"),
        description : Joi.string().empty("").label("توضیحات"),
        unit_price : Joi.number().label("قیمت محصول"),
        specifications : Joi.any().label("مشخصات"),
        image : Joi.any().label("عکس اصلی"),
        colors: Joi.any().label("رنگ ها"),
        discount : Joi.any().label("تخفیف ها"),
        is_show: Joi.any().label("قابل دیدن"),
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">

                    <div className="box-field">
                        <label >اسم محصول</label>
                        {this.renderInput("title", null, null, "input")}
                    </div>

                    <div className="box-field">
                        {this.renderSelect("category", "نوع محصول", "input", this.state.selects_data.categories)}
                    </div>

                    {/* <div className="box-field checkbox-field">
                        <label className="label-checkbox">جنسیت محصول چیست ؟</label>
                        {this.renderInput("is_man","", "checkbox", "custom-checkbox")}
                        <h5 style={{margin: "4px"}}>{this.state.data.is_man ? "مردانه" : "زنانه"}</h5>
                    </div> */}

                    <div className="box-field radio-field">
                        <label className="label-radio">جنسیت محصول چیست؟</label>
                        <div className="box-labels">
                            <label>
                                <input
                                    type="radio"
                                    name="is_man"
                                    value="true"
                                    checked={this.state.data.is_man === true}
                                    onChange={() => this.handleGenderChange(true)}
                                />
                                مردانه 
                            </label>
                            <label style={{marginRight: "15px"}}>
                                <input
                                    type="radio"
                                    name="is_man"
                                    value="false"
                                    checked={this.state.data.is_man === false}
                                    onChange={() => this.handleGenderChange(false)}
                                />
                                زنانه 
                            </label>
                            <label style={{marginRight: "15px"}}>
                                <input
                                    type="radio"
                                    name="is_man"
                                    value="null"
                                    checked={this.state.data.is_man === null}
                                    onChange={() => this.handleGenderChange(null)}
                                />
                                بدون جنسیت 
                            </label>
                        </div>
                    </div>

                    <div className="box-field">
                        {this.renderSelect("sizes", "اندازه ها", "input select-multiple", this.state.selects_data.sizes, true)}
                    </div>

                    <div className="box-field">
                        {this.renderTextArea("description", "توضیحات", "input")}
                    </div>

                    <div className="box-field">
                        {this.renderInput("unit_price", "قیمت", "number", "input")}
                    </div>

                    <div className="box-field image-upload">
                        {this.renderInput("image", "عکس اصلی", "file", "input")}
                        {this.state.image ? <img className="image-field" src={this.state.image} alt="Image"/> : ""}
                    </div>

                    <div className="box-field">
                        {this.renderSelect("colors", "رنگ ها", "input select-multiple", this.state.selects_data.colors, true)}
                    </div>

                    <div className="box-field">
                        {this.renderSelect("discount", "تخفیف", "input", this.state.selects_data.discounts)}
                    </div>


                    {/* <div className="box-field">
                        {this.renderSelect("specifications", "مشخصات", "input select-multiple", this.state.selects_data.specifications, true)}
                        </div> */}

                    <div className="box-field">
                        <div className="form-group">
                            <label>مشخصات</label>
                            <select className="input select-multiple" name="specification_keys" value={this.state.temp_data.specification_keys} multiple={true} onChange={this.handleTempSelectChange}>
                                {this.state.selects_data.specification_keys.map(option => (
                                    <option key={option.value} value={option.value} selected={option.value === this.state.temp_data.specification_keys ? "selected" : ""}>
                                        {option.name + (option.description ?  " : " + option.description : "")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="box-specifications">
                            {this.state.selects_data.specification_keys.length > 0 ? this.state.temp_data.specification_keys.map(key =>
                                <div key={key} className="box-specification">
                                    <p> : {this.state.selects_data.specification_keys.find(element => element.value === key).name}</p>
                                    <div key={key} className="form-group">
                                        <select key={key} className="input select" name="specifications" value={this.state.data.specifications.find(id => this.state.selects_data.specifications[key].find(spec => spec.value === id))} onChange={this.handleSelectChange}>
                                            {this.state.selects_data.specifications[key].map(option => (
                                                <option key={option.value} value={option.value} selected={option.value === this.state.data.specifications ? "selected" : ""}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                </div>
                            ): ""}
                        </div>
                    </div>
                    


                    <div className="box-field checkbox-field">
                        <label className="label-checkbox">دیدن محصول ؟</label>
                        {this.renderInput("is_show", "", "checkbox", "custom-checkbox")}
                    </div>

                    {this.renderButton("ثبت محصول", false, "button red-small")}
                </form>
            </>
        );
    }
}

export default ProductForm;