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



function showInventories(items, params, navigate, state, setState) {
    const handleColorClick = (color) => {
        setState((prevState) => ({
            ...prevState,
            selected_color: color,
        }));
    };

    const handleSizeClick = (size) => {
        setState((prevState) => ({
            ...prevState,
            selected_size: size,
        }));
    };


     // پیدا کردن موجودی مرتبط با رنگ و سایز انتخاب‌شده
     const getInventoryItem = () => {
        return state.inventories.find(
            (item) =>
                (state.selected_color === "all" || item.color.title === state.selected_color.title) &&
                (state.selected_size === "all" || item.size.title === state.selected_size.title)
        );
    };

    // محاسبه مجموع موجودی‌ها
    const calculateTotalInventory = () => {
        return state.inventories
            .filter(
                (item) =>
                    (state.selected_color === "all" || item.color.title === state.selected_color.title) &&
                    (state.selected_size === "all" || item.size.title === state.selected_size.title)
            )
            .reduce((sum, item) => sum + item.number, 0);
    };

    const selectedInventory = getInventoryItem();
    const totalInventory = calculateTotalInventory();

    return (
        <div className="inventory-container">
            {/* نمایش رنگ‌ها */}
            <div className="color-options">
                <h3> : انتخاب رنگ</h3>
                {state.colors.map((color) => (
                    <div
                        key={color.id}
                        className={`color-box ${
                            state.selected_color.title === color.title ? "selected" : ""
                        }`}
                        style={{backgroundColor: state.selected_color.title === color.title ? color.color : ""}}
                        onClick={() => handleColorClick(color)}
                    >
                        {color.title}
                    </div>
                ))}
                <div
                    className={`color-box ${
                        state.selected_color === "all" ? "selected" : ""
                    }`}
                    onClick={() => handleColorClick("all")}
                >
                    ALL
                </div>
            </div>

            {/* نمایش اندازه‌ها */}
            <div className="size-options">
                <h3> : انتخاب اندازه</h3>
                {state.sizes.map((size) => (
                    <div
                        key={size.id}
                        className={`size-box ${
                            state.selected_size.title === size.title ? "selected" : ""
                        }`}
                        onClick={() => handleSizeClick(size)}
                    >
                        {size.title}
                    </div>
                ))}
                <div
                    className={`size-box ${
                        state.selected_size === "all" ? "selected" : ""
                    }`}
                    onClick={() => handleSizeClick("all")}
                >
                    ALL
                </div>
            </div>
        </div>
    );
}



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
                            <div style={{backgroundColor: item.color, padding: "5px", margin: "5px"}}>{item.base_color ? item.base_color.title : item.color}</div>
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
        const product = await request.getObjects(url+"/");
        const images = await request.getObjects(url + "/images/");
        const images_color = await request.getObjects(url + "/images_color/");
        const inventories = await request.getObjects(url + "/inventories/");

        return setState((prevState) => ({
            ...prevState, images: images.data, images_color: images_color.data, inventories: inventories.data,
            colors: product.data.colors, sizes: product.data.sizes}));
    } catch (error) {
        if (error.data) request.showError(error);
    }
}


function Product(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const url = "shop/products/";
    const [state, setState] = useState({
        images: [], images_color: [], inventories: [], selected_color: "all", selected_size: "all", colors: [], sizes: []
    });

    useEffect(() => {
        setData(setState, state, url + params.id);
    }, [location]);

    if (props.user) {
        return (
            <div class="row justify-content-center box-fields">
                <div className="box-padding">
                    <ProductForm
                            navigate={navigate}
                            urlForm={url}
                            getData={true}
                            id={params.id}
                            // toPath="/"
                    />
                </div>
                
                {state.inventories ? <>
                    <h1>: موجودی محصولات</h1>
                    <div className="row g-4">
                        {showInventories(state.inventories, params, navigate, state, setState)}
                    </div>
                </> : ""}
                
                <h1>: تصاویر</h1>
                <div className="row g-4">
                    {showImages(state.images, params, navigate, location)}
                </div>
                <ImageForm
                    navigate={navigate}
                    urlForm={url + params.id + "/images/"}
                    toPath={"/products/" + params.id}
                />

                <h1>: تصاویر رنگی</h1>
                <div className="row g-4">
                    {showImagesColor(state.images_color, params, navigate, location)}
                </div>
                <ImageColorForm
                    navigate={navigate}
                    urlForm={url + params.id + "/images_color/"}
                    toPath={"/products/" + params.id}
                />
            </div>
        );
    }
}

export default Product;