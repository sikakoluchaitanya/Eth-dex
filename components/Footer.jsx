import React from "react";
import { SlSocialLinkedin, SlSocialInstagram, SlSocialTwitter, SlSocialYoutube, SlSocialFacebook, SlSocialGithub } from "react-icons/sl";

const Footer = () => {
  return (
    <div className="footer"
      style={{backgroundImage: 'url("/assets/img/footer-bg.png")'}}
    >
      <div className="container">
        <div className="row">
          <div className="col-12 wow fadeInUp" data-wow-duration="03s" data-wow-delay="0.2s">
            <div className="top-footer">
              <div className="logo">
                <a href="/" className="button-1">
                  Get In Touch
                </a>
              </div>
            </div>
          </div>
          <div className="row justify-content-between">
            <div className="col-lg-2 col-md-6 wow fadeInUp" data-wow-duration="0.3s" data-wow-delay="0.2s">
              <div className="footer-box">
                <h4 className="lasthead"> Company</h4>
                <ul className="footer-link">
                  {["About US", "Contact Us", "Blog", "Affiliate"].
                    map((item, index) => (
                      <li key={index}>
                        <a href="#">{item}</a>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 wow fadeInUp" data-wow-duration="0.4s" data-wow-delay="0.4s">
              <div className="footer-box">
                <h4 className="lasthead">Support</h4>
                <ul className="footer-link">
                  {["FAQ", "Contact Time", "How it works"].
                    map((item, index) => (
                      <li key={index}>
                        <a href="#">{item}</a>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-5 col-md-6 wow fadeInUp" data-wow-duration="0.5s" data-wow-delay="0.5s">
              <div className="footer-box">
                <h4 className="lasthead">Newsletter</h4>
                <form actions="#">
                    <div className="form-group">
                      <input type="email" className="form-control" placeholder="Email Address" />
                      <button className="button-1">Subscribe</button>
                    </div>
                </form>
                    <div className="social-style">
                      <a href="#"><i className="">
                        <SlSocialLinkedin />
                        </i>
                      </a>
                      <a href="#"><i className="">
                        <SlSocialTwitter />  
                      </i></a>
                      <a href="#"><i className="">
                        <SlSocialInstagram />  
                      </i></a>
                      <a href="#"><i className="">
                        <SlSocialYoutube />  
                      </i></a>
                      <a href="#"><i className="">
                        <SlSocialFacebook />
                      </i></a>
                      <a href="#"><i className="">
                        <SlSocialGithub /> 
                      </i></a>
                    </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
