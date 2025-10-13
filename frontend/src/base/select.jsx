import React from "react";

const Select = ({ name, label, options, default_value, value, multiple, error, ...rest }) => {
    return (
        <div className="form-group">
            {label ? <label htmlFor={name}>{label}</label> : ""}
            <select name={name} id={name} value={value} multiple={multiple} {...rest}>
                {options.map(option => (
                    <option key={option.value} value={option.value} selected={option.value === value ? "selected" : ""}>
                        {option.name}
                    </option>
                ))}
            </select>
            {error && (Array.isArray(error) ?
                error.map(item => <div className="alert alert-danger">{item}</div>) :
                <div className="alert alert-danger">{error}</div>)
            }
        </div>
    );
};

export default Select;
