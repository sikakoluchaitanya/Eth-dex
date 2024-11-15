import React from "react";
import { shortAddress } from "../utils/index";

const Header = ({ address, connect }) => {
  const menu = [
    {
      name: "home",
      link: "#home",
    },
    {
      name: "About Us",
      link: "#about",
    },
    {
      name: "Contact Us",
      link: "#contact",
    }
  ];
  return (
    <div className="mein-menu">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNavDropdown"
            aria-controls="navbarNavDropdown"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNavDropdown">
            <ul className="navbar-nav">
            {menu.map((item, index) => (
                <li key={item.name} className="nav-item">
                    <a className="nav-link" href={item.link}>
                        {item.name}
                    </a>
                </li>
            ))}
            {address ? (
                <button className="new_button">
                  {shortAddress(address)}
                </button>
            ):(
              <button onClick={() => connect()} className="new_button">Connect Wallet</button>
            )

            }
            </ul>
          </div>
        </div>
        </nav>
      </div>

  )
};

export default Header;
