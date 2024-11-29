import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { DropdownButton, Dropdown, Button } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import Card from "react-bootstrap/Card";

import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem, MDBBtn, MDBTypography } from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faChartColumn, faAddressCard, faPlus, faCar, faUser, faCoins, faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL, listAll, list } from "firebase/storage";
import { v4 } from "uuid";
import { logoutUser } from "../components/auth";
import { NavLink } from 'react-router-dom';


const AdminSide = () => {
    const navigate = useNavigate();
    const { user, setUser } = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.managementName || "");
    const [managementName, setManagementName] = useState(user.managementName || "");
    const [address, setAddress] = useState(user.companyAddress || "");
    const [companyContact, setCompanyContact] = useState(user.contact || "");
    const [companyEmail, setCompanyEmail] = useState(user.email || "");
    const [imageUpload, setImageUpload] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState("");


    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.uid) : null;
    const listItemStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 15px",
        transition: "background-color 0.3s ease",
        cursor: "pointer",
        backgroundColor: "#FFFFFF",
        border: "none",
        boxShadow: "none",
    };
      // Fetch user profile image
      useEffect(() => {
        const fetchProfileImage = async () => {
            if (auth.currentUser) {
                const userDocRef = doc(db, "agents", auth.currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
    
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setProfileImageUrl(userData.profileImageUrl);
                    console.log("Fetched Profile Image URL:", userData.profileImageUrl);
                } else {
                    console.log("No such document!");
                }
            }
        };
    
        fetchProfileImage().catch(console.error);
    }, []);
    

    const toggleEditing = () => {
        setIsEditing(!isEditing);
    };
    const imageSizeStyles = {
        width: "100%",
        height: "200px", // Set the desired height for all images
        objectFit: "cover",
        borderRadius: "10px", // Set the desired border radius
    };
    const updateUserData = async () => {
        try {
            if (auth.currentUser) {
                const userId = auth.currentUser.uid;
                const userDocRef = doc(db, "establishments", userId);

                const updatedData = {
                    managementName: name,
                    address: address,
                    contact: companyContact,
                    email: companyEmail,
                };

                await updateDoc(userDocRef, updatedData);

                console.log("User data updated/created successfully!");
            } else {
                console.error("User not authenticated");
            }
        } catch (error) {
            console.error("Error updating user data: ", error);
        }
    };
    const handleSaveProfile = () => {
        console.log(auth.currentUser);
        setIsEditing(false);
        updateUserData();
    };
    const uploadFile = () => {
        if (imageUpload && auth.currentUser) {
            const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
            uploadBytes(imageRef, imageUpload).then((snapshot) => {
                getDownloadURL(snapshot.ref).then((url) => {
                    setProfileImageUrl(url);
                    saveProfileImageUrl(url);
                });
            });
        }
    };
    const saveProfileImageUrl = async (url) => {
        if (userDocRef) {
            await updateDoc(userDocRef, {
                profileImageUrl: url,
            });
        }
    };

    return (
      <div className="admin-dashboard" style={{ position: 'fixed', left: 0, top: 0 }}>
          <div className="sidebar">
              <div className="admin-container">         

              <img
							src="customer.jpg"
							alt="Admin"
							className="admin-pic"
							style={{ width: "50px", marginRight: "10px" }}
						/>
						<span className="admin-text">Admin</span>
              </div>
              <div className="wrapper">
                  <div className="side">
                      <h2>Menu</h2>
                      <ul>
                          <li>
                              <NavLink to="/AdminPage" className={({ isActive }) => (isActive ? 'actives' : '')}>
                                  <i className="fas fa-home"></i> Home
                              </NavLink>
                          </li>
                          <li>
                              <NavLink to="/FetchEstablishments" className={({ isActive }) => (isActive ? 'actives' : '')}>
                                  <i className="fas fa-car"></i> Establishment Account
                              </NavLink>
                          </li>
                          <li>
                              <NavLink to="/fetchParkingUsers" className={({ isActive }) => (isActive ? 'actives' : '')}>
                                  <i className="fas fa-calendar"></i> Pakring Seeker List
                              </NavLink>
                          </li>
                          <li>
                              <NavLink to="/fetchAgents" className={({ isActive }) => (isActive ? 'actives' : '')}>
                                  <i className="fas fa-chart-bar"></i> Agents List
                              </NavLink>
                          </li>
                          <li>
              <NavLink 
                to="/" 
                className="logout"
              >
                <i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout
              </NavLink>
            </li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default AdminSide;