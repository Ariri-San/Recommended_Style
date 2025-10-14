import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import request from "../services/requestService";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faRemove } from '@fortawesome/free-solid-svg-icons';
import pagination from "../base/functions";
import ProductsForm from "./forms/productsForm";




function showProducts(items, state, setState) {
    return items.map(item =>
        {
            return (
                <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                    <div className="team-item" >
                        <NavLink to={"/products/" + item.id} onClick={state.selecting ? (e) => e.preventDefault() : ""}>
                            <div className="team-img position-relative overflow-hidden">
                                <img className="img-fluid" src={item.image} alt=""/>
                                <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                                    <h4>id: {item.id}</h4>
                                    <FontAwesomeIcon icon={faEdit} size="2x" color="#9844d4bd"/>
                                </div>
                            </div>
                        </NavLink>
                        <div className="bg-secondary text-center p-4" style={{display: "flex", flexDirection: "column"}}>
                            <h5 className="text-uppercase">{item.title}</h5>
                            <span className="text-primary-2">قیمت : {item.unit_price}</span>
                            {state.selecting ?
                                <input
                                    type="checkbox"
                                    // onClick={() => setState({...state, selected_products: updatedSelected})}
                                    checked={state.selected_products.includes(item.id)}
                                />
                            : ""}
                        </div>
                    </div>
                </div>
            );
        }
    );
}


async function setData(setState, state, location) {
    try {
        const response = await request.getObjects("api/products/" + (location.search ? location.search : ""));
        console.log(response.data);
        return setState({ ...state, data: response.data, change:true});
    } catch (error) {
        if (error.response) request.showError(error);
        return setState({ ...state, show: false });
    }
}

function changeState(state, setState) {
    setState({ ...state, change: false });
}


function customSubmit(event, state, setState, location, navigate) {
    event.preventDefault();

    const listFilter = ["search", "ordering", "page"];
    var first = true;
    location.search = "";

    for (const filter of listFilter) {
        if (state[filter]) {
            if (first) {
                location.search += `?${filter}=` + state[filter];
                first = false;
            }
            else location.search += `&${filter}=` + state[filter];
        }
    }

    navigate(location.search);
    changeState(state, setState);
}  
  


function Products(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    
    const [state, setState] = useState({
        data: [],
        search: searchParams.get("search"),
        ordering: searchParams.get("ordering"),
        change: false,
        products: []
    });


    useEffect(() => {
        setData(setState, state, location);
    }, [location]);


    if (state.data.results)
        return (
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="text-center mx-auto mb-5 wow fadeInUp title-products" data-wow-delay="0.1s">
                        <h2 className="d-inline-block bg-secondary text-primary-2 py-1 px-4">محصولات</h2>
                        <form id="search" onSubmit={event => customSubmit(event, state, setState, location, navigate)}>
                            <div class="container h-100">
                                <div class="d-flex justify-content-center h-100">
                                    <div class="searchbar">
                                    <input
                                        class="search_input"
                                        type="text"
                                        defaultValue={state.search}
                                        onChange={event => setState({ ...state, search: event.target.value })}
                                        placeholder="Type Something"
                                        id="search"
                                        name="search"
                                        onkeypress="handle"
                                    />
                                    <select
                                        className="select_box"
                                        defaultValue={state.ordering}
                                        id="ordering" name="ordering"
                                        onChange={event => setState({ ...state, ordering: event.target.value })}
                                        >
                                        <option className="option_search" value="title">A to Z</option>
                                        <option className="option_search" value="-title">Z to A</option>
                                        <option className="option_search" value="category">Category ascending</option>
                                        <option className="option_search" value="-category">Category descending</option>
                                        <option className="option_search" value="unit_price">unit_price ascending</option>
                                        <option className="option_search" value="-unit_price">unit_price descending</option>
                                        <option className="option_search" value="last_update">last_update ascending</option>
                                        <option className="option_search" value="-last_update">last_update descending</option>
                                    </select>
                                    <button class="search_icon"><i class="fas fa-search"></i></button>

                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="row g-4">
                        {showProducts(state.data.results, state, setState)}
                    </div>

                    {pagination(state.data.links, "api/products/")}
                </div>
            </div>
    );
    else if (!props.user){
        // navigate("/login")
    };

}

export default Products;