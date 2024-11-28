import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardBody, MDBCardImage, MDBBtn } from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 } from "uuid";
import EstablishmentReserve from "./establishmentReserve";
import "./profile.css"; 


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
    const [reservationDuration, setReservationDuration] = useState(""); // duration in minutes


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
                        setReservationDuration(userData.reservationDuration || "");
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
                profileImageUrl: imageUrl,
                reservationDuration: reservationDuration 
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
        <section>
        <div className="admin-dashboard"> {/* Adjusted marginTop to account for navbar */}

            <div className="sidebar">
                <div className="admin-container">
                </div>
                <div class="wrapper">
                    <div class="side">
                        <div>
                        <EstablishmentReserve/>
                        
                    </div>
                    
                </div>

                </div>
        </div>

                <MDBContainer className="py-5" style={{  marginTop: '10vh' }}>
                    <MDBRow className="justify-content-center">
                        <MDBCol md="8">
                        <MDBCard className="shadow custom-card">
                                <MDBCardBody>
                                <h1 className="title">Establishment Info</h1> 
                                <div>&nbsp;</div>
                                <div>&nbsp;</div>



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
                                            <div className="mb-3">
        <label htmlFor="duration" className="form-label">Reservation Duration (minutes)</label>
        <input type="number" className="form-control" id="duration" value={reservationDuration} onChange={(e) => setReservationDuration(Number(e.target.value))} disabled={!isEditing} />
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
                                            <h1 className="card-title mb-4" style={{ fontSize: "1.7rem" }}>{name}</h1>
                                            <p className="card-text mb-1"><strong>Location:</strong> {address}</p>
                                            <p className="card-text mb-1"><strong>Email:</strong> {companyEmail}</p>
                                            <p className="card-text mb-1"><strong>Parking Fee:</strong> {parkingPay}</p>
                                            <p className="card-text mb-1"><strong>Contact Number:</strong> {companyContact}</p>
                                            <p className="card-text mb-1"><strong>Open Time:</strong> {openTime || "Not Set"}</p>
                                            <p className="card-text mb-1"><strong>Close Time:</strong> {closeTime || "Not Set"}</p>
                                            <p className="card-text mb-1"><strong>Reservation Duration:</strong> {reservationDuration || "Not Set"}</p>
                                            <div>&nbsp;</div>
                                            <div>&nbsp;</div>
                                            <MDBBtn
                                            className="mb-3"
                                            onClick={toggleEditing}
                                            style={{
                                                backgroundColor: '#003851',
                                                color: 'white',
                                                border: 'none',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                                                borderRadius: '50px' // Rounded edges to match your previous example
                                            }}
                                        >
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
