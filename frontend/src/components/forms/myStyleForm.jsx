import React from "react";
import Joi, { errors } from "joi-browser";
// import { NavLink } from "react-router-dom";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";



class MyStyleForm extends Form {
    // async getData() {
    //     try{
    //         const data = (await request.getObjects(this.props.urlForm, this.props.id)).data;
    //         const image = data.image;

    //         var new_temp_data = this.state.temp_data;
    //         new_temp_data.specification_keys = data.specifications.map(function(item){return item.key.id});
            
    //         data["category"] = data.category.id;
    //         data.sizes = data.sizes.map(function(item){return item.id});
    //         data.colors = data.colors.map(function(item){return item.id});
    //         data.specifications = data.specifications.map(function(item){return item.id});
    //         data.image = "";
    
    //         var new_data = this.state.data;
    //         Object.keys(this.state.data).forEach(function(key, index) {
    //             if (key in new_data && data[key]){
    //                 new_data[key] = data[key];
    //             }
    //         });

    //         new_data.discount = data.discount ? data.discount.id : null;

    //         this.setState({...this.state, data: new_data, temp_data: new_temp_data, image: image});
    //     }catch (error) {
    //         console.log(error)
    //         toast.error(error.response.data.detail);
    //         return false
    //     }
    // }

    // async getSelectData(url, name_item) {
    //     try{
    //         const data = (await request.getObjects(url)).data;
    //         return data.map(function(item){return {"value": item.id, "name": item[name_item]}});

    //     } catch{
    //         return []
    //     }
    // }

    // async changeData(){
    //     var new_selects_data = this.state.selects_data;
    //     var new_data = this.state.data;
        
    //     new_selects_data.categories = await this.getSelectData("shop/categories/", "title");
    //     new_selects_data.colors = await this.getSelectData("shop/colors/", "title"); 
        
    //     if (!this.state.data.category && new_selects_data.categories[0]) new_data.category = new_selects_data.categories[0]["value"];

    //     new_selects_data.sizes = await this.getSelectData("shop/sizes/" + (this.state.data.category ? "?category_id=" + this.state.data.category : ""), "title");
    //     try{
    //         const specification_keys = (await request.getObjects("shop/specification_keys/" + (this.state.data.category ? "?category_id=" + this.state.data.category : ""))).data;
    //         new_selects_data.specification_keys = specification_keys.map(function(item){return {"value": item.id, "name": item["title"], "description": item["description"]}})
            
    //         for (let index = 0; index < specification_keys.length; index++) {
    //             new_selects_data.specifications[specification_keys[index].id] = specification_keys[index].specifications.map(function(item){return {"value": item.id, "name": item["value"]}});
    //         }
    //     }catch{
    //         new_selects_data.specification_keys = [];
    //     }
    //     new_selects_data.discounts.push({value: "", "name": "بدون تخفیف"});
    //     (await request.getObjects("shop/discounts/")).data.map(item => new_selects_data.discounts.push({"value": item.id, "name": item["title"]}));

    //     this.setState({...this.state, data: new_data, selects_data: new_selects_data});
    // }


    // async componentDidMount() {
    //     if (this.props.getData){
    //         await this.getData();
    //     }
    //     this.changeData();
    // };
    
    // componentDidUpdate(prevProps, prevState) {
    //     if (this.state.data.category !== prevState.data.category) {
    //         this.changeData();
    //     }
    // };

    // handleGenderChange = (value) => {
    //     const data = { ...this.state.data };
    //     data.is_man = value;
    //     this.setState({ data });
    // };

    // handleTempSelectChange = ({ currentTarget: input }) => {
    //     const temp_data = { ...this.state.temp_data };
    //     const data = { ...this.state.data };

    //     temp_data[input.name] = []
    //     var options = input.options;

    //     for (var i=0; i<options.length; i++) {
    //         if (options[i].selected){
    //             temp_data[input.name].push(Number(options[i].value));
    //             if (!this.state.selects_data.specifications[options[i].value].find(spec => this.state.data.specifications.find(id => id === spec.value)))
    //                 data.specifications.push(Number(this.state.selects_data.specifications[options[i].value][0].value));
    //         } 
    //         else if (this.state.selects_data.specifications[options[i].value].find(spec => this.state.data.specifications.find(id => id === spec.value))){
    //             const index = data.specifications.indexOf(this.state.selects_data.specifications[options[i].value].find(spec => this.state.data.specifications.find(id => id === spec.value)).value);
    //             data.specifications.splice(index, 1);
    //         };
    //     }
        
    //     this.setState({ temp_data, data });
    // };

    // handleSelectChange = ({ currentTarget: input }) => {
    //     const data = { ...this.state.data };
    //     const options = input.options;

    //     for (var i=0; i<options.length; i++) {
    //         if (data[input.name].find(id => id === Number(options[i].value))){
    //             const index = data[input.name].indexOf(data[input.name].find(id => id === Number(options[i].value)));
    //             data[input.name].splice(index, 1);
    //         };
    //     }

    //     data[input.name].push(Number(input.value))
    //     this.setState({ data });
    // };

    state = {
        data: { 
            image : null,
        },
        errors: {},
        buttonDisabled: false,
    };

    schema = {
        image : Joi.any().label("عکس"),
    };


    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} method="post">

                    <div className="box-field image-upload">
                        {this.renderInput("image", "عکس", "file", "input")}
                        {this.state.image ? <img className="image-field" src={this.state.image} alt="Image"/> : ""}
                    </div>

                    {this.renderButton("ثبت محصول", false, "button red-small")}
                </form>
            </>
        );
    }
}

export default MyStyleForm;