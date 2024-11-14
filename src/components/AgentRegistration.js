import React, { useState, useContext,  useEffect } from "react";
import { db, auth } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, collection, doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { DropdownButton, Dropdown, Button } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import UserContext from "../UserContext";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem, MDBBtn, MDBTypography } from "mdb-react-ui-kit";
import './dashboardCard.css'
import './AgentRegistration.css'
import EstablishmentReserve from "./establishmentReserve";

function CreateAccount() {
    const location = useLocation();
    const { user } = useContext(UserContext);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [companyAddress, setCompanyAddress] = useState(user.companyAddress);
    const [managementName, setManagementName] = useState(user.managementName);
    const [companyContact, setCompanyContact] = useState(user.contact);
    const [selectedRadioOption, setSelectedRadioOption] = useState("");
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.uid) : null;
    useEffect(() => {
      if (userDocRef) {
          const fetchImageUrl = async () => {
              const docSnap = await getDoc(userDocRef);
              if (docSnap.exists()) {
                  const userData = docSnap.data();
                  setProfileImageUrl(userData.profileImageUrl);
              } else {
                  console.log("No such document!");
              }
          };

          fetchImageUrl().catch(console.error);
      }
  }, [userDocRef]);
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
    const handlelogin = () => {
        navigate("/");
    };
    const handleFeed = () => {
        navigate("/Feedback");
    };
    const handleViewProfile = () => {
        navigate("/Profiles");
    };
    const handleRevenues = () => {
        navigate("/Tracks");
    };
    const handleButtonClick = () => {
        navigate("/TicketInfo");
    };
    const handleRegister = () => {
        navigate("/AgentRegistration");
    };
    const handleAgentSchedule = () => {
        navigate("/AgentSchedule");
    };
    const listItemHoverStyle = {
        backgroundColor: "#003851",
    };
    const customListItemStyle = {
        border: "none", // Remove border from list items
        backgroundColor: "#FFFFFF",
    };
    const navigate = useNavigate();
    const collectionRef = collection(db, "agents");

    const handleBack = () => {
        navigate("/Dashboard");
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "agents", user.uid), {
                uid: user.uid,
                firstName,
                lastName,
                email,
                phoneNumber,
                address,
                password,
                managementName,
                companyAddress,
                companyContact,
                selectedRadioOption,
            });

            console.log("Document successfully written and user registered!");
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setPhoneNumber("");
            setAddress("");
            setSelectedRadioOption("");

            alert("Successfully registered!");
            navigate("/Dashboard");
        } catch (error) {
            console.error("Error creating account:", error);
            alert(error.message);
        }
    };

    const handleRadioChange = (e) => {
        setSelectedRadioOption(e.target.value);
    };

    const inputGroupStyle = {
        marginBottom: "15px",
        marginRight: "10px",
        marginTop: "10px",
    };

    const inputStyle = {
        width: "100%",
        padding: "10px",
        marginBottom: "15px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        fontSize: "16px",
        fontFamily: "Georgina",
    };

    const buttonStyle = {
        width: "100%",
        padding: "12px",
        backgroundColor: "rgba(4, 55,55, 0.7)",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "18px",
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
      <MDBContainer>
        <MDBRow>
          {/* <MDBCol className="background-container d-flex align-items-center justify-content-center" style={{marginTop: '10vh', margin: 'auto', wi}}>
            <div className="overlay">
              <div className="text-content">
                <h2>SpotWise</h2>
                <h3>"Experience precise and accurate account management at your fingertips."</h3>
                <p>Efficiency Unleashed</p>
                <p>Manage with Precision</p>
                <p>Optimize Your Workflow</p>
              </div>
            </div>
          </MDBCol> */}
          <MDBCol className="d-flex align-items-center justify-content-center form-column">
            <MDBCard className="form-container" style={{
              height: '85vh',
              margin: 'auto',
              borderRadius: '50px',
              backgroundColor: '#eceef6',  // Light background color
              boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)'  // More pronounced shadow
            }}>
              <MDBCardBody className="card-body">
                <h2 className="text-center mb-4" style={{ fontWeight: "bold" }}>Create Operator Account</h2>
                <form onSubmit={handleSubmit} className="form-body">
                  <div className="input-group">
                    <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
                  </div>
                  <div className="radio-group">
                    <label>
                      <input type="radio" value="Male" checked={selectedRadioOption === "Male"} onChange={handleRadioChange} /> Male
                    </label>
                    <label>
                      <input type="radio" value="Female" checked={selectedRadioOption === "Female"} onChange={handleRadioChange} /> Female
                    </label>
                  </div>
                  <div className="form-footer">
                    <button type="submit">Register</button>
                  </div>
                </form>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
   

            
        </section>
    );
}

export default CreateAccount;