import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import CryptoJS from "crypto-js";
import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { useSnackbar } from 'notistack';
import "./Login.css";
import { HiOutlineMail } from "react-icons/hi";
import { MdOutlineNoEncryptionGmailerrorred } from "react-icons/md";

const Login = () => {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      "BhItHub"
    ).toString();

    fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: encryptedPassword,
      }),
    })
    .then((response) => response.json().then((data) => {
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        enqueueSnackbar(data.message, { variant: 'success' });
        navigate("/dashboard");
      } else {
        enqueueSnackbar(data.message, { variant: 'error' });
      }
    }))
    .catch((error) => {
      console.error("Error:", error);
      enqueueSnackbar('An unexpected error occurred. Please try again.', { variant: 'error' });
    });
  };

  return (
    <Container className=" vh-100 d-flex align-items-center justify-content-center  ">
      <div className=" login-container w-100  p-3 mb-5 bg-body-tertiary rounded">
        <h2 className="text-center">Login</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group
            controlId="formBasicEmail"
            className="d-flex align-items-center justify-content-center my-4"
          >
            <HiOutlineMail />
            <Form.Control
              className="login-inputs"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group
            controlId="formBasicPassword"
            className="d-flex align-items-center justify-content-center"
          >
            <MdOutlineNoEncryptionGmailerrorred />
            <Form.Control
              className="login-inputs "
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-50 mt-3 mx-auto d-block"
          >
            Login
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Login;
