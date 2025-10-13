import React from "react";
import Joi from "joi-browser";
import Form from "../../base/form.jsx";
import request from "../../services/requestService.js";
import { toast } from "react-toastify";
import Select from "react-select";
import '../../css/ticket.css';

class ChatForm extends Form {
    state = {
        data: {
            text: "",
            product: ""
        },
        errors: {},
        buttonDisabled: false,
        products: [],
    };

    schema = {
        text: Joi.string().label("متن"),
        product: Joi.any()
    };
    
    doSubmit = async (data) => {
        // try {
            const formData = this.setFormData(data, new FormData());
            var response = ""

            if (this.props.create_seeTicket){
                const see_ticket = await request.saveObject(null, this.props.urlForm);
                console.log(see_ticket);
                response = request.saveObject(formData, `${this.props.urlForm}${see_ticket.data.id}/chats/`, this.props.id);

            } else {
                response = request.saveObject(formData, this.props.urlForm, this.props.id);
            }

            this.buttonDisabled = true;
            const results = await response;

            toast.promise(
                response.then(() => new Promise(resolve => setTimeout(resolve, 300))),
                {
                    pending: 'در حال ارسال...',
                    success: {
                        render: this.props.textSuccess || `${results.data.id ? `ID: ${results.data.id}, ` : ""}message: ${results.statusText}`,
                        autoClose: 1500
                    },
                    error: `${results.statusText} 🤯`
                }
            );

            await new Promise(resolve => setTimeout(resolve, 2000));
            this.buttonDisabled = false;

            if (this.props.onResults) {
                this.props.onResults(data, results);
            }

            this.setState({
                data: { text: "", product: "" }
            });

            return this.props.navigate(this.props.toPath);

        // } catch (error) {
        //     this.buttonDisabled = false;

        //     if (error.response?.data) {
        //         const errorData = this.addErrors(error.response.data, {});
        //         const newErrors = {};

        //         if (errorData["key"] === "0") {
        //             toast.error(errorData["value"][0]);
        //         } else {
        //             newErrors[errorData["key"]] = errorData["value"];
        //             this.setState({ errors: newErrors });
        //         }

        //         await new Promise(resolve => setTimeout(resolve, 500));
        //         this.props.navigate();
        //     } else {
        //         toast.error("server is offline");
        //     }
        // }
    };

    async componentDidMount() {
        try {
            const { data: productsData } = await request.getObjects("shop/seller_products/?no_page=true");
            const products = productsData.map(item => ({
                value: item.id,
                label: item.title,
                image: item.image
            }));
            this.setState({ products });
        } catch (error) {
            toast.error("خطا در بارگذاری محصولات");
        }
    }

    getCustomStyles = () => ({
        control: (provided, state) => ({
            ...provided,
            backgroundColor: "#353040",
            borderColor: state.isFocused ? "#6c5ce7" : "#555",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(108, 92, 231, 0.5)" : "none",
            borderRadius: "8px",
            padding: "5px",
            fontSize: "16px",
            color: "#fff",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? "#6c5ce7" : "#2f2c35",
            color: state.isFocused ? "#fff" : "#ccc",
            padding: "10px 15px",
            cursor: "pointer",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#fff",
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: "#2f2c35",
            borderRadius: "8px",
            marginTop: "5px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }),
        input: (provided) => ({
            ...provided,
            color: "#fff",
            width: "200px",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#aaa",
        }),
    });
    

    formatOptionLabel = ({ label, image }) => (
        <div style={{ display: "flex", alignItems: "center" }}>
            <img src={image} alt={label} style={{ width: 40, height: 40, marginRight: 10 }} />
            <span>{label}</span>
        </div>
    );

    handleProductChange = (selectedOption) => {
        const data = { ...this.state.data, product: selectedOption ? selectedOption.value : "" };
        this.setState({ data });
    };


    render() {
        const { data, products } = this.state;

        return (
            <form className="form" onSubmit={this.handleSubmit} method="post">
                <div className="form-box">
                    <div className="form-group text-box">
                        {this.renderTextArea("text", "متن", "input input-text", { placeholder: "متن" })}
                    </div>
                    <div className="form-group">
                        <label>محصول</label>
                        <Select
                            value={products.find(p => p.value === data.product) || null}
                            options={products}
                            onChange={this.handleProductChange}
                            formatOptionLabel={this.formatOptionLabel}
                            placeholder="جستجو و انتخاب محصول..."
                            styles={this.getCustomStyles()}
                            isClearable
                        />
                    </div>
                </div>
                {this.renderButton("ارسال پیام", false, "button button-text red")}
            </form>
        );
    }
}

export default ChatForm;
