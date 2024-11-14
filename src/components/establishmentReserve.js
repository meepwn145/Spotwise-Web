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


const EstablishmentReserve = () => {
    const navigate = useNavigate();
    const { user, setUser } = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.managementName || "");
    const [managementName, setManagementName] = useState(user.managementName || "");
    const [address, setAddress] = useState(user.companyAddress || "");
    const [companyContact, setCompanyContact] = useState(user.contact || "");
    const [companyEmail, setCompanyEmail] = useState(user.email || "");
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [imageUpload, setImageUpload] = useState(null);

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

    const listItemHoverStyle = {
        backgroundColor: "#003851",
    };
    const handleHome =() => {
        navigate("/Dashboard");
    }
    const handleAgentRegister =() => {
        navigate("/AgentRegistration");
    }    
    const handleTracks =() => {
        navigate("/Tracks");
    }    
    const handleProfile =() => {
        navigate("/Profiles");
    }   
     const handleFeedback =() => {
        navigate("/Feedback");
    }

    const handleLogOut = async () => {
        try {
          await logoutUser();
          // Perform any additional cleanup or state updates
          setUser(null);  // Assuming setUser updates the user state context
          navigate('/');  // Redirect to the login page or any other appropriate route
        } catch (error) {
          console.error('Failed to log out:', error);
        }
      };

    const customListItemStyle = {
        border: "none", // Remove border from list items
        backgroundColor: "#FFFFFF",
    };
    const handlelogin = () => {
        navigate("/");
    };
    const styles = {
        welcomeMessage: {
            position: "absolute",
            top: "10px",
            right: "10px",
            margin: "0",
            color: "#fff",
            fontFamily: "Rockwell, sans-serif",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
        },
        icon: {
            marginRight: "5px",
        },
    };
    return (
        <div>
             <div className="admin-dashboard" style={{ position: 'fixed', left: 0, top: 0 }}>
            <div className="sidebar">
            <div className="sidebar-header" style={{ textAlign: 'center', color: 'white', padding: '20px' }}>
    {profileImageUrl ? (
        <MDBCardImage src={profileImageUrl} alt="Operator Profile Logo" className="rounded-circle" style={{ width: "70px", height: "70px" }} fluid />
    ) : (
        <MDBCardImage src="default_placeholder.jpg" alt="Default Profile Logo" className="rounded-circle" style={{ width: "70px", height: "70px" }} fluid />
    )}
    <div style={{ marginTop: '10px', fontSize: '24px' }}>
        Welcome, {managementName || 'No name found'}
    </div>
</div>

                <div class="wrapper">
        <div class="side">
            <ul>
                <li>
                <NavLink 
                    to="/Dashboard" 
                    className={({ isActive }) => (isActive ? 'actives' : '')}
                >
                    <i className="fas fa-home"></i>Home
                </NavLink>
                </li>
                <li>
                <NavLink 
                    to="/AgentRegistration" 
                    className={({ isActive }) => (isActive ? 'actives' : '')}
                >
                    <i className="fas fa-home"></i>Operator Registration
                </NavLink>
                </li>
                <li>
                <NavLink 
                    to="/Tracks" 
                    className={({ isActive }) => (isActive ? 'actives' : '')}
                >
                    <i className="fas fa-user"></i>Account Management
                </NavLink>
                </li>
                <li>
                <NavLink 
                    to="/Profiles" 
                    className={({ isActive }) => (isActive ? 'actives' : '')}
                >
                    <i className="fas fa-address-card"></i>Profile
                </NavLink>
                </li>
                <li>
                <NavLink 
                    to="/Feedback" 
                    className={({ isActive }) => (isActive ? 'actives' : '')}
                >
                    <i className="fas fa-blog"></i>Feedback
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
            </div>
        );
};

export default EstablishmentReserve;