import React, {useState, useEffect} from "react";
import { useNavigate, useLocation, useParams } from "react-router";
// import { NavLink } from "react-router-dom";
import ProductForm from "./forms/productForm";
import ImageForm from "./forms/imageForm";
import ImageColorForm from "./forms/imageColorForm";
import DeleteData from './../base/deleteData';
import request from "../services/requestService"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons'


function showImages(items, params, navigate, location) {
    return items.map( item =>
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                <div className="team-item">
                    <div className="team-img position-relative overflow-hidden">
                        <img className="img-fluid" src={item.image} alt=""/>
                        <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                            <h4>id: {item.id}</h4>
                            <DeleteData
                                label="حذف عکس"
                                location={location}
                                navigate={navigate}
                                id={item.id}
                                urlDelete={`shop/products/${params.id}/images/`}
                                commentSuccess={`تصویر با آیدی ${item.id} حذف شد`}
                                className="btn btn-dark primary"
                                closeLable="بستن"
                                title="حذف کردن عکس"
                                body="آیا مطمئن هستید که این تصویر از محصول شما حذف شود؟"
                            ></DeleteData>
                        </div>
                    </div>
                </div>
            </div>
    );
}



function showImagesColor(items, params, navigate, location) {
    return items.map( item =>
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                <div className="team-item">
                    <div className="team-img position-relative overflow-hidden">
                        <img className="img-fluid" src={item.image} alt=""/>
                        <div className="team-social" style={{display:"flex", flexDirection: "column"}}>
                            <h4>id: {item.id}</h4>
                            <div style={{backgroundColor: item.color, padding: "5px"}}>{item.base_color.title}</div>
                            <DeleteData
                                label="حذف عکس"
                                location={location}
                                navigate={navigate}
                                id={item.id}
                                urlDelete={`shop/products/${params.id}/images_color/`}
                                commentSuccess={`تصویر با آیدی ${item.id} حذف شد`}
                                className="btn btn-dark primary"
                                closeLable="بستن"
                                title="حذف کردن عکس"
                                body="آیا مطمئن هستید که این تصویر از محصول شما حذف شود؟"
                            ></DeleteData>
                        </div>
                    </div>
                </div>
            </div>
    );
}



async function setData(setState, state, url) {
    try {
        const images = await request.getObjects(url + "/images/");
        const images_color = await request.getObjects(url + "/images_color/");

        return setState({ images: images.data, images_color: images_color.data});
    } catch (error) {
        if (error.data) request.showError(error);
    }
}


function Product(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const url = "shop/products/";

    if (props.user) {
        return (
            <div class="row justify-content-center box-fields">
                <div className="segment">
                    <h1>اضافه کردن محصول</h1>
                </div>
                <ProductForm
                        navigate={navigate}
                        urlForm={url}
                        // getData={true}
                        toPath="/products/"
                />
            </div>
        );
    }
}

export default Product;