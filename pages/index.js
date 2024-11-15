import React, { useState, useContext, useEffect } from "react";

// internal import
import {
  Hero,
  Header,
  Footer,
  Feature,
  Preloader,
  Token,
  Loader
} from "../components/index"
import { CONTEXT } from "../context/context"

const index = () => {
  const {
    TOKEN_SWAP,
    LOAD_TOKEN,
    notifyError,
    notifySuccess,
    setLoading,
    loading,
    connect,
    address,
    swap,
  } = useContext(CONTEXT);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    document.body.classList.toggle('dark-mode', savedMode);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', newMode);
      document.body.classList.toggle('dark-mode', newMode);
      return newMode;
    });
  };

  //open token component 
  const [token_1, setToken_1] = useState();
  const [token_2, setToken_2] = useState();
  const [openToken, setOpenToken] = useState(false);

  //input 
  const [slippageAmount, setSlippageAmount] = useState(2);
  const [deadlineMinutes, setDeadlineMinutes] = useState(10);
  const [inputAmount, setInputAmount] = useState(undefined);

  // output 
  const [outputAmount, setOutputAmount] = useState(undefined);
  const [transaction, setTransaction] = useState(undefined);
  const [ratio, setRatio] = useState(undefined);
  return (
    <div>
    <button onClick={toggleDarkMode}>
      {darkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
    <Preloader />
    <Header address={address} connect={connect} />
    <Hero
      setInputAmount={setInputAmount}
      setLoader={setLoading}
      setOpenToken={setOpenToken}
      LOAD_TOKEN={LOAD_TOKEN}
      token_1={token_1}
      token_2={token_2}
      inputAmount={inputAmount}
      setToken_1={setToken_1}
      setToken_2={setToken_2}
      swap={swap}
    />
    <Feature />
    <Footer />

    {
      openToken && (
        <div className="new_loader">
          <Token
            notifyError={notifyError}
            notifySuccess={notifySuccess}
            setOpenToken={setOpenToken}
            LOAD_TOKEN={LOAD_TOKEN}
            setToken_1={setToken_1}
            setToken_2={setToken_2}
            token_1={token_1}
            token_2={token_2}
          />
        </div>
      )}

      {
        loading && (
          <div className="new_loader">
            <Loader />
          </div>
        )
      }
  </div>
  )
};

export default index;
