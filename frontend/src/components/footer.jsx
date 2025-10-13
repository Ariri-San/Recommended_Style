import React from "react";

function Footer() {
    return(
        <div className="container-fluid bg-secondary text-light footer mt-5 pt-5 wow fadeIn" data-wow-delay="0.1s">
            <div className="container py-5">
                <div className="row g-5">
                    <div className="col-lg-4 col-md-6">
                        <h4 className="text-uppercase mb-4">Get In Touch</h4>
                        <div className="d-flex align-items-center mb-2">
                            <div className="btn-square bg-dark flex-shrink-0 me-3">
                                <span className="fa fa-map-marker-alt text-primary-2"></span>
                            </div>
                            <span>123 Street, New York, USA</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                            <div className="btn-square bg-dark flex-shrink-0 me-3">
                                <span className="fa fa-phone-alt text-primary-2"></span>
                            </div>
                            <span>+012 345 67890</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <div className="btn-square bg-dark flex-shrink-0 me-3">
                                <span className="fa fa-envelope-open text-primary-2"></span>
                            </div>
                            <span>info@example.com</span>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <h4 className="text-uppercase mb-4">Quick Links</h4>
                        <a className="btn btn-link" href="">About Us</a>
                        <a className="btn btn-link" href="">Contact Us</a>
                        <a className="btn btn-link" href="">Our Services</a>
                        <a className="btn btn-link" href="">Terms & Condition</a>
                        <a className="btn btn-link" href="">Support</a>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <div className="d-flex pt-1 m-n1">
                            <a className="btn btn-lg-square btn-dark text-primary-2 m-1" href=""><i className="fab fa-twitter"></i></a>
                            <a className="btn btn-lg-square btn-dark text-primary-2 m-1" href=""><i className="fab fa-facebook-f"></i></a>
                            <a className="btn btn-lg-square btn-dark text-primary-2 m-1" href=""><i className="fab fa-youtube"></i></a>
                            <a className="btn btn-lg-square btn-dark text-primary-2 m-1" href=""><i className="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Footer;