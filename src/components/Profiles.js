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
    const [companyAddress, setCompanyAddress] = useState("");
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
    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.email) : null;
    const [hourType, setHourType] = useState("");  // State to hold hour type from Firebase
    const [continuousHourFee, setContinuousHourFee] = useState("");
    const [fixedHourFee, setFixedHourFee] = useState("");
    const [allocatedTimeForArrival, setAllocatedTimeForArrival] = useState("");
    const [gracePeriod, setGracePeriod] = useState("");
    console.log("Current user UID:", auth.currentUser ? auth.currentUser.email : "No user logged in");

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (auth.currentUser && auth.currentUser.email) {
                const email = auth.currentUser.email;
                const userDocRef = doc(db, "establishments", email);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfileImageUrl(userData.profileImageUrl || "default_placeholder.jpg");
                    setName(userData.managementName || "");
                    setManagementName(userData.managementName || "");
                    setCompanyAddress(userData.companyAddress || "");
                    setCompanyContact(userData.contact || "");
                    setCompanyEmail(userData.email || "");
                    setParkingPay(userData.parkingPay || "");
                    setHourType(userData.hourType || "");
                    setReservationDuration(userData.reservationDuration || "");
                    setAllocatedTimeForArrival(userData.allocatedTimeForArrival || "");
                    setGracePeriod(userData.gracePeriod || "");
                    if (userData.hourType === "Continuous") {
                        setContinuousHourFee(userData.continuousParkingFee || "");
                    } else if (userData.hourType === "Fixed") {
                        setFixedHourFee(userData.fixedParkingFee || "");
                    }
                } else {
                    console.log("No such document!");
                }
            }
        };
    
        fetchUserDetails().catch(console.error);
    }, []); // Empty dependency array to fetch only once
    

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
                companyAddress: companyAddress,
                contact: companyContact,
                email: companyEmail,
                openTime: tempOpenTime,
                closeTime: tempCloseTime,
                parkingPay: parkingPay,
                profileImageUrl: imageUrl,
                reservationDuration: reservationDuration,
                hourType: hourType, // Preserve the fetched hour type
                continuousParkingFee: hourType === "Continuous" ? continuousHourFee : undefined,
                fixedParkingFee: hourType === "Fixed" ? fixedHourFee : undefined,
                allocatedTimeForArrival: allocatedTimeForArrival,
                gracePeriod:  hourType === "Continuous" ? gracePeriod : undefined,
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
    function convertMinutesToHours(minutes) {
        return minutes / 60;
    }
    

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
        if (!isEditing) {
            // Update temporary state to match current values when entering edit mode
            setTempOpenTime(openTime);
            setTempCloseTime(closeTime);
            setReservationDuration(reservationDuration);
            setParkingPay(parkingPay);
            setAllocatedTimeForArrival(allocatedTimeForArrival);
        }
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
                                                <input type="text" className="form-control" placeholder="Location" value={companyAddress} onChange={(e) => companyAddress(e.target.value)} />
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
    <input 
        type="number" 
        className="form-control" 
        id="duration" 
        placeholder="Enter duration in minutes"
        value={reservationDuration} 
        onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 0 && Number.isInteger(value)) {
                setReservationDuration(value);
            }
        }} 
        min="0" // Ensures no negative numbers
        disabled={!isEditing} 
    />
    {reservationDuration < 0 && (
        <div className="text-danger">Please enter a positive number.</div>
    )}
    {hourType === "Continuous" && (
    <div className="mb-3">
        <label htmlFor="continuousHourFee" className="form-label">Continuous Hours Fee</label>
        <input
            id="continuousHourFee"
            type="text"
            className="form-control"
            placeholder="Enter Continuous Hours Fee"
            value={continuousHourFee}
            onChange={(e) => setContinuousHourFee(e.target.value)}
        />
    </div>
)}
<div className="mb-3">
        <label htmlFor="gracePeriod" className="form-label">Grace Period</label>
        <input
            id="gracePeriod"
            type="number"
            className="form-control"
            placeholder="Grace Period"
            value={gracePeriod}
            min="0" //
            onChange={(e) => setGracePeriod(e.target.value)}
        />
    </div>
<div className="mb-3">
    <label htmlFor="allocatedTime" className="form-label">Allocated Time For Arrival (minutes)</label>
    <input
        type="number" 
        className="form-control" 
        placeholder="Enter Allocated Time For Arrival"
        value={allocatedTimeForArrival}
        onChange={(e) => setAllocatedTimeForArrival(e.target.value)}
        min="0" // Ensures no negative numbers
        disabled={!isEditing} 
    />
</div>

{hourType === "Fixed" && (
    <div className="mb-3">
        <label htmlFor="fixedHourFee" className="form-label">Fixed Hours Fee</label>
        <input
            id="fixedHourFee"
            type="text"
            className="form-control"
            placeholder="Enter Fixed Hours Fee"
            value={parkingPay} // Assuming you have this state
            onChange={(e) => setFixedHourFee(e.target.value)}
        />
    </div>
)}
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
                                            <p className="card-text mb-1"><strong>Location:</strong> {companyAddress}</p>
                                            <p className="card-text mb-1"><strong>Email:</strong> {companyEmail}</p>
                                            <p className="card-text mb-1"><strong>Parking Fee:</strong> {parkingPay}</p>
                                            <p className="card-text mb-1"><strong>Contact Number:</strong> {companyContact}</p>
                                            <p className="card-text mb-1"><strong>Open Time:</strong> {openTime || "Not Set"}</p>
                                            <p className="card-text mb-1"><strong>Close Time:</strong> {closeTime || "Not Set"}</p>
                                            <p className="card-text mb-1"><strong>Reservation Duration:</strong> {reservationDuration || "Not Set"} minute(s)</p>
                                            <p className="card-text mb-1"><strong>Parking Type: </strong> {hourType || "Not Set"}</p>
                                            <p className="card-text mb-1"><strong>Allocated Time for Arrival: </strong> {allocatedTimeForArrival || "Not Set"} minute(s)</p>
                                            <p className="card-text mb-1"><strong>Grace Period: </strong> {gracePeriod || "Not Set"} minute(s)</p>
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
