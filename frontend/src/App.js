import React, { Component } from "react";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router";

// Import Functions
import request from "./services/requestService";
import auth from "./services/authService";

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './base/styles.css'
import "./templates/css/bootstrap.min.css";
import "./templates/css/style.css";
import "./css/form.css";
import "./css/search.css";
import "./css/products.css";
import "./css/styles.css";


// Import Js Functions
import "https://code.jquery.com/jquery-3.4.1.min.js";
import "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js";
// import "./templates/lib/wow/wow.min.js";

// Import Web Pages
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Register from "./components/register";
import Login from "./components/login";
import Logout from "./components/logout";
import Home from "./components/home";
import Products from "./components/products";
import Product from "./components/product";
import AddProducts from "./components/add_products";
import User from './components/user';
import Styles from "./components/styles";
import Style from "./components/style";



class App extends Component {
  state = {};

  async componentDidMount() {
    try {
      const result = await request.getObjects("auth/users/me/");
      this.setState({
        user: {
          id: result.data.id,
          username: result.data.username,
        },
      });
    } catch (error) {
      // console.log(error);
    }
  }

  render() {
    return (
      <React.Fragment>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link rel="preconnect" href="https://fonts.gstatic.com"/>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Oswald:wght@600&display=swap" rel="stylesheet"/>

          <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet"/>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet"/>
        </head>

        <ToastContainer />
        <Navbar user={this.state.user} />
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/user" element={<User user={this.state.user} />}></Route>
          <Route path="/products" element={<Products user={this.state.user} />}></Route>
          <Route path="/products/:id" element={<Product user={this.state.user} />}></Route>
          <Route path="/add_product" element={<AddProducts user={this.state.user} />}></Route>
          <Route path="/styles" element={<Styles user={this.state.user} />}></Route>
          <Route path="/styles/:id" element={<Style user={this.state.user} />}></Route>

          <Route path="/register" element={<Register user={this.state.user} />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/logout" element={<Logout />}></Route>
        </Routes>
        <Footer/>
      </React.Fragment>
    );
  }
}

export default App;