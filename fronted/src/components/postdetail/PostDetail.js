import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Container, Spinner, Modal, Form, Button } from "react-bootstrap";
import axios from "axios";
import { IoPhonePortraitOutline } from "react-icons/io5";
import { RiLockPasswordLine } from "react-icons/ri";
import { useSnackbar } from "notistack";

const PostDetail = () => {
  const { postId } = useParams();
  const postIdRef = useRef(postId);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const storedVerificationStatus = localStorage.getItem(
      `isVerified_${postIdRef.current}`
    );

    if (storedVerificationStatus) {
      setIsVerified(storedVerificationStatus === "true");
      setIsLoading(false);
    } else {
      checkVerificationStatus();
    }
  }, [postId]);

  useEffect(() => {
    postIdRef.current = postId;
  }, [postId]);

  const checkVerificationStatus = async (token, postId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/verify-status/${postIdRef.current}`
      );
      if (response.data.isVerified) {
        setIsVerified(true);
        localStorage.setItem(`isVerified_${postIdRef.current}`, "true");
      } else {
        setIsLoading(false);
        setOtpModal(true);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setIsLoading(false);
      setOtpModal(true);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/post/${postId}`
        );
        setPost(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching post:", error);
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const sendOtp = async () => {
    if (!phoneNumber || !/^\d{10}$/i.test(phoneNumber)) {
      enqueueSnackbar("Please enter a valid phone number.", {
        variant: "error",
      });
      return;
    }
    try {
      await axios.post("http://localhost:3000/sendotp", { phoneNumber });
      enqueueSnackbar("OTP successfully sent", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      enqueueSnackbar("Error sending OTP. Please try again later.", {
        variant: "error",
      });
    }
  };
  const verifyOtp = async () => {
    try {
      await axios.post("http://localhost:3000/verifyotp", { otp, phoneNumber });
      localStorage.setItem(`isVerified_${postId}`, "true"); // Store verification status with postId
      setOtpModal(false);
      setIsVerified(true);
      enqueueSnackbar("Now you can see links data", {
        variant: "info",
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setVerificationError("Invalid OTP. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status" variant="primary"></Spinner>
      </div>
    );
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <Container>
      <h2>Your Product</h2>
      {isVerified ? (
        <div className="Dash-board-container">
          <div className="dash-borard-img-video">
            {post.isVideo ? (
              <video
                src={`http://localhost:3000/public/uploads/${post.image}`}
                alt={post.image}
                className="w-100 h-100 object-fit-cover"
                controls
              />
            ) : (
              <img
                src={`http://localhost:3000/public/uploads/${post.image}`}
                alt={post.image}
                className="w-100 h-100 object-fit-cover"
              />
            )}
          </div>
          <div>
            {post.description ? (
              <p className="mt-2 h-6 fw-normal">
                Description: {post.description}
              </p>
            ) : null}
            <p>
              <strong>Start Date:</strong>{" "}
              {new Date(post.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {new Date(post.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : (
        <Modal show={otpModal} onHide={() => setOtpModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Verify Mobile Number</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex justify-content-between align-items-center gap-2 my-4">
              <Form.Group
                controlId="phoneNumber"
                className="d-flex justify-content-between align-items-center w-75 mw-75"
              >
                <IoPhonePortraitOutline />
                <Form.Control
                  className="login-inputs"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" onClick={sendOtp}>
                Send OTP
              </Button>
            </div>

            <div className="d-flex justify-content-between align-items-center gap-2 my-5">
              <Form.Group
                controlId="otp"
                className="d-flex justify-content-between align-items-center w-75 mw-50"
              >
                <RiLockPasswordLine />
                <Form.Control
                  className="login-inputs"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" onClick={verifyOtp}>
                Verify OTP
              </Button>
            </div>
            {verificationError && (
              <p className="text-danger">{verificationError}</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="m-auto"
              variant="secondary"
              onClick={() => setOtpModal(false)}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default PostDetail;
