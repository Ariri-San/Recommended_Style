import React, { Component } from "react";
import Joi from "joi-browser";
import Input from "./input";
import Select from "./select";
import TextArea from "./textArea";
import { toast } from "react-toastify";
import request from "../services/requestService.js";


class Form extends Component {
    state = {
        data: {},
        dataFormData: [],
        errors: {},
    };


    doSubmit = async (data) => {
        // console.log(data, this.props)

        if (this.props.onSubmit) return this.props.onSubmit(this.state);
        else if ( this.onSubmit) return this.onSubmit(data);

        try {
            const formData = new FormData();
            for (const key in data) {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            }
            const response = request.saveObject(data, this.props.urlForm, this.props.id, this.props.isPut, {headers: { "Content-Type": "multipart/form-data" }});
            
            this.buttonDisabled = true;
            
            const results = await response;

            toast.promise(
                response.then(() => new Promise(resolve => setTimeout(resolve, 300))),
                {
                    pending: 'Loading...',
                    success: { render: this.props.message ? this.props.message : `${results.data.id ? `Id: ${results.data.id}, ` : ""}message: ${results.statusText}`, autoClose: 1500 },
                    error: `${results.statusText} 🤯`
                }
            );

            console.log(results);

            await new Promise(resolve => setTimeout(resolve, 2000))
            this.buttonDisabled = false;
            if (this.props.onResults) {
                this.props.onResults(data, results);
            }

            if (this.props.toPath) {
                return this.props.navigate(this.props.toPath);
            }

        } catch (error) {
            if (error.response){
                console.log(error)
                if (error.response.data) {
                    const errorData = this.addErrors(error.response.data, {}), newError = {}
                    if (errorData["key"] === "0") toast.error(errorData["value"][0]);
                    else newError[errorData["key"]] = errorData["value"];
                    this.setState({ errors: newError });
    
                    // console.log(error);
                    toast.error(error.response.statusText);
                };
    
                await new Promise(resolve => setTimeout(resolve, 500))
                this.buttonDisabled = false;
                this.props.navigate();
            }
            else {
                this.buttonDisabled = false;
                return toast.error("server is ofline");
            }
        }
    };


    setFormData(data, formData) {
        for (const key in data) {
            if (data){
                if (typeof data[key] === "object" && data[key]){
                    // console.log(key, data[key])
                    if (Object.keys(data[key]).length > 0) {
                        data[key].forEach(item => {
                            formData.append(key, item);
                        });
                    } else if (data[key].length !== 0) formData.append(key, data[key])
                } else if (data[key]) formData.append(key, data[key]);
            }
        }

        // for (let pair of formData.entries()) {
        //     console.log(pair[0], pair[1]);
        // }

        return formData;
    }


    addErrors(error, new_error) {
        if (Array.isArray(error))
            return {
                "key": Object.keys(error)[0],
                "value": error
            };
        for (const key in error) {
            if (key === "detail") return toast.error(error.detail)
            if (Object.hasOwnProperty.call(error, key)) {
                if (Array.isArray(error[key]))
                    return {
                        "key": Object.keys(error)[0],
                        "value": error[key]
                    };
                if (Object.keys(error[key])) {
                    const error_2 = this.addErrors(error[key]);
                    return {
                        "key": Object.keys(error)[0] + "." + error_2["key"],
                        "value": error_2["value"]
                    };
                }
            }
        }
        return error;
    }



    updateNestedValue(obj, keys, newValue) {
        var obj_2 = obj;

        for (let index = 0; index < keys.length - 1; index++) {
            obj_2 = obj_2[keys[index]];
        }

        obj_2[keys[keys.length - 1]] = newValue;

        return obj;
    }


    validate = () => {
        const options = { abortEarly: false };
        const { error } = Joi.validate(this.state.data, this.schema, options);
        if (!error) return null;

        const errors = {};
        for (let item of error.details) errors[item.path[0]] = item.message;
        return errors;
    };

    validateProperty = ({ name, value }) => {
        const obj = { [name]: value };
        const array = name.split(".");
        var schema = this.schema;
        for (let index = 0; index < array.length; index++) {
            schema = schema[array[index]];
        }

        schema = { [name]: schema };
        const { error } = Joi.validate(obj, schema);
        return error ? error.details[0].message : null;
    };

    handleSubmit = e => {
        e.preventDefault();

        const errors = this.validate();
        this.setState({ errors: errors || {} });
        if (errors) return;

        var data = { ...this.state.data };
        for (const input of e.target) {
            if (input.type === "file") {
                data = this.updateNestedValue(data, input.name.split("."), input.files[0]);
            }
        }

        this.doSubmit(data);
    };

    handleChange = ({ currentTarget: input }) => {
        var value = input.value;
        var data = { ...this.state.data };

        if (input.type === "checkbox") value = input.checked;
        
        const errors = { ...this.state.errors };
        const errorMessage = this.validateProperty(input);
        if (errorMessage) errors[input.name] = errorMessage;
        else delete errors[input.name];
        
        if (input.type === "select-multiple"){
            data[input.name] = []
            var options = input.options;

            for (var i=0; i<options.length; i++) {
                if (options[i].selected) data[input.name].push(Number(options[i].value));
            }
        } else data = this.updateNestedValue(data, input.name.split("."), value);

        this.setState({ data, errors });
    };

    renderButton(label, disabled=false, className = "btn btn-primary", style={}) {
        return (
            <button disabled={this.validate() || disabled} className={className} style={style}>
                {label}
            </button>
        );
    }

    renderSelect(name, label, className="form-control", options, multiple=false) {
        const { data, errors } = this.state;

        return (
            <Select
                key={name}
                name={name}
                value={data[name]}
                label={label}
                options={options}
                multiple={multiple}
                onChange={this.handleChange}
                error={errors[name]}
                className={className}
            />
        );
    }

    renderInput(name, label, type = "text", class_name="form-control", options={}) {
        const { data, errors } = this.state;

        return (
            <Input
                key={name}
                type={type}
                name={name}
                value={data[name]}
                label={label}
                className={class_name}
                onChange={this.handleChange}
                error={errors[name]}
                {...options}
            />
        );
    }

    renderTextArea(name, label, class_name="form-control") {
        const { data, errors } = this.state;

        return (
            <TextArea
                key={name}
                name={name}
                value={data[name]}
                label={label}
                className={class_name}
                onChange={this.handleChange}
                error={errors[name]}
            />
        );
    }


}



export default Form;
