import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardBody, MDBCardImage, MDBBtn } from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 } from "uuid";

export default function EditButton() {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [managementName, setManagementName] = useState("");
    const [address, setAddress] = useState("");
    const [companyContact, setCompanyContact] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [openTime, setOpenTime] = useState("");
    const [closeTime, setCloseTime] = useState("");
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [imageUpload, setImageUpload] = useState(null);
    const [parkingPay, setParkingPay] = useState("");

    // Temporary state to hold the editable values
    const [tempOpenTime, setTempOpenTime] = useState("");
    const [tempCloseTime, setTempCloseTime] = useState("");

    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.uid) : null;

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (userDocRef) {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfileImageUrl(userData.profileImageUrl || "default_placeholder.jpg");
                    setName(userData.managementName || user.managementName || "");
                    setManagementName(userData.managementName || user.managementName || "");
                    setAddress(userData.address || user.companyAddress || "");
                    setCompanyContact(userData.contact || user.contact || "");
                    setCompanyEmail(userData.email || user.email || "");
                    setParkingPay(userData.parkingPay || user.parkingPay || "");
                    // Update only if they haven't been edited yet
                    if (!isEditing) {
                        setOpenTime(userData.openTime || "");
                        setCloseTime(userData.closeTime || "");
                    }
                } else {
                    console.log("No such document!");
                }
            }
        };
        fetchUserDetails().catch(console.error);
    }, [userDocRef, user]);

    useEffect(() => {
        setTempOpenTime(openTime);
        setTempCloseTime(closeTime);
    }, [openTime, closeTime]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageUpload(file);
        }
    };

    const uploadFile = async () => {
        if (imageUpload && auth.currentUser) {
            const imageRef = ref(storage, `establishmentprofile/${imageUpload.name}-${v4()}`);
            try {
                const snapshot = await uploadBytes(imageRef, imageUpload);
                const url = await getDownloadURL(snapshot.ref);
                setProfileImageUrl(url);
                console.log("Image uploaded and URL retrieved:", url);
                return url;
            } catch (error) {
                console.error("Error uploading file: ", error);
                return "";
            }
        }
        return "";
    };

    const updateUserData = async (imageUrl) => {
        if (auth.currentUser) {
            const updatedData = {
                managementName: name,
                address: address,
                contact: companyContact,
                email: companyEmail,
                openTime: tempOpenTime,
                closeTime: tempCloseTime,
                parkingPay: parkingPay,
                profileImageUrl: imageUrl
            };

            // Remove any fields that are empty or undefined
            Object.keys(updatedData).forEach(key => {
                if (updatedData[key] === undefined || updatedData[key] === null || updatedData[key] === "") {
                    delete updatedData[key];
                }
            });

            try {
                await updateDoc(userDocRef, updatedData);
                console.log("User data updated/created successfully!");
                console.log("Updated profile image URL:", imageUrl);
                setIsEditing(false);  // Exit edit mode after successful update
            } catch (error) {
                console.error("Error updating user data: ", error);
            }
        } else {
            console.error("User not authenticated");
        }
    };

    const handleSaveProfile = async () => {
        let finalImageUrl = profileImageUrl;

        if (imageUpload) {
            const url = await uploadFile();
            if (url) {
                finalImageUrl = url;
                console.log("Image uploaded and URL retrieved:", url);
            } else {
                console.log("Failed to upload image or retrieve URL");
                return;
            }
        }

        await updateUserData(finalImageUrl);
    };

    const toggleEditing = () => {
        setIsEditing(!isEditing);
        // Update temporary state to current values
        setTempOpenTime(openTime);
        setTempCloseTime(closeTime);
    };

    const buttonStyles = {
        overflow: "visible",
        width: "120px",
        height: "35px",
    };

    return (
        <section style={{ backgroundSize: "cover", backgroundRepeat: "no-repeat", minHeight: "100vh", backgroundColor: "white" }}>
            <div className="admin-dashboard">
                <div className="sidebar">
                    <div className="admin-container"></div>
                    <div className="wrapper">
                        <div className="side">
                            <div>
                                <MDBCardImage src={profileImageUrl} alt="Operator Profile Logo" className="rounded-circle" style={{ width: "70px" }} />
                                <p style={{ fontFamily: "Georgina", fontSize: "20px", fontWeight: "bold", color: 'white' }}>Administrator</p>
                                <p style={{ fontFamily: "Georgina", color: "white", fontWeight: "bold", fontSize: 12, marginTop: -15 }}>
                                    {managementName}
                                </p>
                            </div>
                            <h2>Menu</h2>
                            <ul>
                                <li><a href="Dashboard"><i className="fas fa-home"></i>Home</a></li>
                                <li><a href='AgentRegistration'><i className="fas fa-user"></i>Account Management</a></li>
                                <li><a href='Tracks'><i className="fas fa-project-diagram"></i>Operator Registration</a></li>
                                <li><a href="Profiles"><i className="fas fa-blog"></i>Profile</a></li>
                                <li><a href="Feedback"><i className="fas fa-blog"></i>Feedback</a></li>
                                <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
                            </ul>
                        </div>
                    </div>
                    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#132B4B', position: "fixed", width: "100%", height: '15%', marginTop: '-8%' }}>
                        <div className="container">
                            <Link className="navbar-brand" to="/Dashboard" style={{ fontSize: "25px" }}></Link>
                        </div>
                    </nav>
                </div>

                <MDBContainer className="py-5" style={{ backgroundColor: "#f9f9f9", marginTop: '10vh' }}>
                    <MDBRow className="justify-content-center">
                        <MDBCol md="8">
                            <MDBCard className="shadow">
                                <MDBCardBody>
                                    <div className="text-center mb-4">
                                        <MDBCardImage src={profileImageUrl || "defaultt.png"} alt="Profile" className="img-thumbnail" style={{ width: "150px", borderRadius: "50%" }} />
                                    </div>
                                    {isEditing ? (
                                        <>
                                            <div className="mb-3">
                                                <input type="file" className="form-control" id="file-upload" onChange={handleFileChange} />
                                                <label htmlFor="file-upload">
                                                    <MDBBtn outline color="dark" className="mb-3" style={buttonStyles} component="span">
                                                        Upload Image
                                                    </MDBBtn>
                                                </label>
                                            </div>
                                            <div className="mb-3">
                                                <input type="text" className="form-control" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                                            </div>
                                            <div className="mb-3">
                                                <input type="text" className="form-control" placeholder="Location" value={address} onChange={(e) => setAddress(e.target.value)} />
                                            </div>
                                            <div className="mb-3">
                                                <input type="email" className="form-control" placeholder="Email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                                            </div>
                                            <div className="mb-3">
                                                <input type="text" className="form-control" placeholder="Parking Pay" value={parkingPay} onChange={(e) => setParkingPay(e.target.value)} />
                                            </div>
                                            <div className="mb-3">
                                                <input type="tel" className="form-control" placeholder="Contact Number" value={companyContact} onChange={(e) => setCompanyContact(e.target.value)} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Open Time</label>
                                                <input type="time" className="form-control" value={tempOpenTime} onChange={(e) => setTempOpenTime(e.target.value)} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Close Time</label>
                                                <input type="time" className="form-control" value={tempCloseTime} onChange={(e) => setTempCloseTime(e.target.value)} />
                                            </div>
                                            <MDBBtn color="primary" className="me-2" onClick={handleSaveProfile} style={buttonStyles}>
                                                Save Changes
                                            </MDBBtn>
                                            <MDBBtn color="danger" onClick={toggleEditing} style={buttonStyles}>
                                                Cancel
                                            </MDBBtn>
                                        </>
                                    ) : (
                                        <>
                                            <h4 className="card-title mb-4">{name}</h4>
                                            <p className="card-text mb-1">Location: {address}</p>
                                            <p className="card-text mb-1">Email: {companyEmail}</p>
                                            <p className="card-text mb-1">Parking Fee: {parkingPay}</p>
                                            <p className="card-text mb-1">Contact Number: {companyContact}</p>
                                            <p className="card-text mb-1">Open Time: {openTime || "Not Set"}</p>
                                            <p className="card-text mb-1">Close Time: {closeTime || "Not Set"}</p>
                                            <MDBBtn color="dark" className="mb-3" onClick={toggleEditing} style={buttonStyles}>
                                                Edit Profile
                                            </MDBBtn>
                                        </>
                                    )}
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                    </MDBRow>
                </MDBContainer>
            </div>
        </section>
    );
}
