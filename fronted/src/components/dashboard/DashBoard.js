import React, { useState, useEffect } from "react";
import { Modal, Button, Container, Spinner, Form } from "react-bootstrap";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DashBoard.css";
import { MdDelete, MdModeEditOutline } from "react-icons/md";
import { useSnackbar } from "notistack";
import { IoIosShareAlt } from "react-icons/io";

const DashBoard = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [linksData, setLinksData] = useState([]);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [description, setDescription] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [fileName, setFileName] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  const openDialog = () => {
    setShowDialog(true);
    setDescription("");
  };

  const openEditDialog = (post) => {
    setEditMode(true);
    setEditPostId(post._id);
    setStartDate(new Date(post.startDate));
    setEndDate(new Date(post.endDate));
    setDescription(post.description);
    setIsVideo(post.isVideo);
    setSelectedFile(post.file);
    setFileName(post.file ? post.file.name : "");
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditMode(false);
    setEditPostId(null);
    setSelectedFile(null);
    setStartDate(null);
    setEndDate(null);
    setIsVideo(false);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      enqueueSnackbar("Start date cannot be after end date", {
        variant: "error",
      });
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (startDate && date < startDate) {
      enqueueSnackbar("End date cannot be before start date", {
        variant: "error",
      });
    }
  };

  const handleShareClick = async (link) => {
    try {
      if (navigator.share) {
        await navigator.share({
          url: link,
        });
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (error) {
      enqueueSnackbar("Error sharing link!", { variant: "error" });
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "video/mp4",
    ];
    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      enqueueSnackbar(
        "Please select a valid image file (jpg, jpeg, png, gif)",
        {
          variant: "error",
        }
      );
      event.target.value = null;
      setSelectedFile(null);
      setFileName("");
    }
  };

  const handleUpload = async () => {
    if (!startDate || !endDate) {
      enqueueSnackbar("Please select both start and end dates", {
        variant: "error",
      });
      return;
    }
    if (startDate > endDate) {
      enqueueSnackbar("Start date cannot be after end date", {
        variant: "error",
      });
      return;
    }

    if (!selectedFile) {
      enqueueSnackbar("No file selected for upload", { variant: "error" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("isVideo", isVideo);
      formData.append("description", description);

      const res = await axios.post(
        "http://localhost:3000/create/post",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
        }
      );
      closeDialog();
      if (res.status === 201) {
        setLinksData([...linksData, res.data.post]);
        enqueueSnackbar(res.data.message, { variant: "success" });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error.response && error.response.status === 400) {
        enqueueSnackbar(error.response.data.message || "Bad Request", {
          variant: "error",
        });
      } else {
        enqueueSnackbar("Something went wrong, please try again!", {
          variant: "error",
        });
      }
    }
  };

  const handleUpdate = () => {
    return new Promise(async (resolve, reject) => {
      if (!startDate || !endDate) {
        enqueueSnackbar("Please select both start and end dates", {
          variant: "error",
        });
        return;
      }

      if (startDate > endDate) {
        enqueueSnackbar("Start date cannot be after end date", {
          variant: "error",
        });
        return;
      }

      try {
        const formData = new FormData();
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);
        formData.append("isVideo", isVideo);
        formData.append("description", description);

        if (selectedFile && selectedFile.type) {
          formData.append("image", selectedFile);

          if (selectedFile.type.startsWith("video")) {
            formData.set("isVideo", true);
          } else {
            formData.set("isVideo", false);
          }
        }

        const response = await axios.put(
          `http://localhost:3000/update/post/${editPostId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              authorization: `Bearer ${token}`,
            },
          }
        );

        const { data, status } = response;

        if (status === 200) {
          setLinksData((prevLinksData) => {
            return prevLinksData.map((link) => {
              if (link._id === editPostId) {
                return data.post;
              } else {
                return link;
              }
            });
          });

          enqueueSnackbar(data.message, { variant: "success" });
          closeDialog();
        }
      } catch (error) {
        console.error("Error updating link:", error);
        if (error.response && error.response.status === 400) {
          enqueueSnackbar(error.response.data.message || "Bad Request", {
            variant: "error",
          });
        } else {
          enqueueSnackbar("Error updating link! ", { variant: "error" });
        }
        reject(error);
      }
    });
  };

  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this post?"
      );
      if (!confirmDelete) return;

      await axios.delete(`http://localhost:3000/delete/post/${id}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      setLinksData((prevLinksData) =>
        prevLinksData.filter((post) => post._id !== id)
      );

      enqueueSnackbar("Link deleted successfully", { variant: "success" });
    } catch (error) {
      console.error("Error deleting link:", error);
      enqueueSnackbar("Error deleting link", { variant: "error" });
    }
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    axios
      .get("http://localhost:3000/posts", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setLinksData(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, [token]);

  return isLoading ? (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" role="status" variant="primary"></Spinner>
    </div>
  ) : (
    <Container>
      <div className="d-flex align-items-center justify-content-between pt-3">
        <h4>Admin DashBoard</h4>
        <Button variant="primary" onClick={openDialog}>
          Create Link
        </Button>
      </div>
      {linksData?.map((post) => (
        <div className="Dash-board-container" key={post._id}>
          <div className="dash-borard-img-video">
            {post?.isVideo ? (
              post?.image ? (
                <video
                  src={`http://localhost:3000/public/uploads/${post.image}`}
                  alt={post?.image}
                  controls
                  className="w-100 h-100 object-fit-cover"
                />
              ) : (
                <p>Video not available</p>
              )
            ) : post?.image ? (
              <img
                src={`http://localhost:3000/public/uploads/${post.image}`}
                alt={post?.image}
                className="w-100 h-100 object-fit-cover"
              />
            ) : (
              <p>Image not available</p>
            )}
          </div>
          <div className="h-50">
            {post.description ? (
              <p className="mt-2 h-6 fw-normal">
                Description: {post.description}
              </p>
            ) : null}
            <p>
              Link:
              <span className="cursor-pointer text-primary unde">
                &nbsp;{post.link}
              </span>
              <Button
                onClick={() => handleShareClick(post.link)}
                variant="primary"
              >
                <IoIosShareAlt />
              </Button>
            </p>
            <p className="mt-2 h-6 fw-normal">
              Start Date: {new Date(post.startDate).toLocaleDateString()}
            </p>
            <p className="mt-2 h-6 fw-normal">
              End Date: {new Date(post.endDate).toLocaleDateString()}
            </p>
            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="secondary"
                className="px-4 py-1 text-center"
                onClick={() => openEditDialog(post)}
              >
                <MdModeEditOutline />
              </Button>
              <Button
                variant="danger"
                className="px-4 py-1 text-center"
                onClick={() => handleDelete(post._id)}
              >
                <MdDelete />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Modal show={showDialog} onHide={closeDialog}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Link" : "Create Link"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="startDate" className="mt-3">
            <Form.Label className="w-25 fw-bold">Start Date :</Form.Label>
            <DatePicker
              className="date-input-box"
              selected={startDate}
              onChange={handleStartDateChange}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select Start Date"
            />
          </Form.Group>

          <Form.Group controlId="endDate" className="mt-3">
            <Form.Label className="w-25 fw-bold">End Date :</Form.Label>
            <DatePicker
              className="date-input-box"
              selected={endDate}
              onChange={handleEndDateChange}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select End Date"
            />
          </Form.Group>
          <h6 className="w-50 mt-4">Please upload your file here</h6>
          <div className="d-flex flex-column">
            <label htmlFor="fileInput" className="custom-file-upload">
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              Upload File
            </label>
            <span>{fileName || ""}</span>
          </div>

          <Form.Group controlId="description" className="mt-3">
            <Form.Label className="w-25 fw-bold">Description</Form.Label>
            <Form.Control
              className="date-input-box"
              as="textarea"
              rows={3}
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter description"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          {editMode ? (
            <Button variant="primary" onClick={handleUpdate}>
              Update
            </Button>
          ) : (
            <Button variant="primary" onClick={handleUpload}>
              Submit
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DashBoard;
