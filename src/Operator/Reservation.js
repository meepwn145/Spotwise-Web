import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../config/firebase";
import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBCard,
  MDBCardText,
  MDBCardBody,
  MDBCardImage,
  MDBListGroup,
  MDBListGroupItem,
} from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import OperatorReserve from "./operatorReserve";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import MapComponent from "../components/Map";

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Reservation = () => {

    const { user } = useContext(UserContext);
    const [reservationRequests, setReservationRequests] = useState([]);
    const [historyLog, setHistoryLog] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [userNames, setUserNames] = useState({});
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [slotSets, setSlotSets] = useState([]);
    const [totalParkingSpaces, setTotalParkingSpaces] = useState(0);
    const [occupiedSpaces, setOccupiedSpaces] = useState(0);
    const [availableSpaces, setAvailableSpaces] = useState(0);
    const [activeCard, setActiveCard] = useState('');
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [parkingSeeker, setParkingSeeker] = useState([]);
    const [summaryCardsData, setSummaryCardsData] = useState([]);
    const [agent, setAgent] = useState([]);    
    const [showAccepted, setShowAccepted] = useState(false);
    const [showDeclined, setShowDeclined] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const filterByDate = (logEntry) => {
      if (startDate && endDate) {
          const reservationDate = new Date(logEntry.date);
          return reservationDate >= startDate && reservationDate <= endDate;
      }
      return true;
  };
  
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const notification = change.doc.data();
              console.log("New notification: ", notification);
              // Display the notification on your web app
            }
          });
        });
    
        return () => unsubscribe();
      }, []);


    const fetchReservations = async (managementName) => {
        console.log("Fetching reservations for managementName:", managementName);
        const q = query(collection(db, "reservations"), where("managementName", "==", managementName));
        try {
            const querySnapshot = await getDocs(q);
            const reservationPromises = querySnapshot.docs.map(async (reservationDoc) => {
                const slotId = reservationDoc.data().slotId;
                const userEmail = reservationDoc.data().userEmail;
                const floorTitle = reservationDoc.data().floorTitle; 

          // Fetch the floor name from the slotData sub-document
          const slotDocRef = doc(
            db,
            "slot",
            managementName,
            "slotData",
            `slot_${slotId}`
          );
          const slotDocSnapshot = await getDoc(slotDocRef);

          // Fetch user data
          const userQuery = query(
            collection(db, "user"),
            where("email", "==", userEmail)
          );
          const userSnapshot = await getDocs(userQuery);
          const userData = userSnapshot.docs[0]?.data();

          setUserNames((prevUserNames) => ({
            ...prevUserNames,
            [userEmail]: userData?.name || "N/A",
          }));

          return {
            id: reservationDoc.id,
            name: reservationDoc.data().name,
            location: reservationDoc.data().currentLocation,
            userName: userData?.name || "N/A", // Add the userName property
            carPlateNumber: userData?.carPlateNumber || "N/A",
            slot: typeof slotId === "string" ? slotId.slice(1) : "N/A",
            slotId: slotId,
                    floorTitle,
                    userEmail,
            timeOfRequest: new Date(
              reservationDoc.data().timestamp.seconds * 1000
            ).toLocaleTimeString("en-US", {
              hour12: true,
              hour: "numeric",
              minute: "numeric",
            }),
            date: new Date(reservationDoc.data().timestamp.seconds * 1000).toLocaleDateString("en-US"),
          };
        }
      );
      const reservations = await Promise.all(reservationPromises);
      console.log("Fetched reservations:", reservations);
      setReservationRequests(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && user?.managementName) {
        console.log("User authenticated. Fetching reservations...");
        fetchReservations(user.managementName);
      } else {
        console.log("User not authenticated or managementName is null.");
        setReservationRequests([]);
      }
    });

    return () => unsubscribe();
  }, [user?.managementName]);

  useEffect(() => {
    localStorage.setItem(
      "reservationRequests",
      JSON.stringify(reservationRequests)
    );
  }, [reservationRequests]);

  useEffect(() => {
    const storedHistoryLog = JSON.parse(localStorage.getItem("historyLog"));
    if (storedHistoryLog) {
      setHistoryLog(storedHistoryLog);
    }
  }, []);

  const getContinuousSlotNumber = (currentSetIndex, index) => {
    let previousSlots = 0;
    for (let i = 0; i < currentSetIndex; i++) {
      previousSlots += slotSets[i].slots.length;
    }
    return previousSlots + index + 1;
  };

  const fetchSubIdByEmail = async (email) => {
    // Implement the logic to fetch the sub_id from Native Notify or your local mapping
    // This is a placeholder function. You need to replace it with actual logic.
    // Example:
    const response = await fetch(`https://aapp.nativenotify.com/api/indie/notification/get-sub-id?email=${encodeURIComponent(email)}`, {
        headers: {
            'Authorization': 'Bearer YOUR_API_KEY'
        }
    });
    const data = await response.json();
    return data.sub_id; // assuming the response contains `sub_id`
};
const handleReservation = async (accepted, reservationRequest, index) => {
  const { id, userName, carPlateNumber, slotId, timeOfRequest, floorTitle, userToken, userEmail } = reservationRequest;
  const status = accepted ? "Accepted" : "Declined";

  const logEntry = {
      status,
      name: userName,
      carPlateNumber,
      slotId,
      timeOfRequest,
      email: userEmail || 'N/A', // Ensure email is not undefined
      date: new Date().toLocaleDateString("en-US"),
  };

  setHistoryLog([logEntry, ...historyLog]);
  localStorage.setItem("historyLog", JSON.stringify([logEntry, ...historyLog]));

  if (accepted) {
      try {
          console.log(`Floor Title: ${floorTitle}, Slot ID: ${slotId}`);
          const slotDocRef = doc(db, "slot", user.managementName, "slotData", `slot_${floorTitle}_${slotId}`);

          await setDoc(slotDocRef, {
              userDetails: {
                  name: userName,
                  carPlateNumber,
                  slotId,
                  floorTitle,
                  userEmail,
              },
              from: "Reservation",
              status: "Occupied",
              timestamp: new Date(),
              reserveStatus: 'Accepted',
          }, { merge: true });

          const reservationDocRef = doc(db, "reservations", id);
          await deleteDoc(reservationDocRef);

          // Fetch the user token from Firestore
          if (userEmail) {
              const userTokenDocRef = doc(db, "userTokens", userEmail);
              const docSnap = await getDoc(userTokenDocRef);
              if (docSnap.exists()) {
                  const { token } = docSnap.data();
                  const notificationData = {
                      appId: 24190,
                      appToken: '7xmUkgEHBQtdSvSHDbZ9zd',
                      title: 'Reservation',
                      message: `Your reservation at ${user.managementName} on ${floorTitle} ${slotId + 1} is accepted`,
                      targetUsers: [token], // Send to device token
                      subID: userEmail,
                      color: '#FF0000FF'
                  };

                  console.log("Sending notification with data:", JSON.stringify(notificationData));
                  fetch('https://app.nativenotify.com/api/indie/notification', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${notificationData.appToken}`
                      },
                      body: JSON.stringify(notificationData)
                  })
                  .then(response => response.text())
                  .then(text => {
                      if (text === "Success!") {
                          console.log('Notification sent successfully:', text);
                          alert('Notification sent successfully.');
                      } else {
                          try {
                              const data = JSON.parse(text);
                              console.log('Notification sent:', data);
                              alert('Notification sent successfully.');
                          } catch (error) {
                              console.error('Response received but not in expected format:', text);
                              alert(`Received unexpected response format. Response was: ${text}`);
                          }
                      }
                  })
                  .catch(error => {
                      console.error('Error sending notification:', error);
                      alert('Failed to send notification. Check the console for more details.');
                  });
              } else {
                  console.error("Error: No device token found for userEmail.");
                  alert("No device token found for the email.");
              }
          } else {
              console.error("Error: userEmail is null or undefined.");
              alert("No valid email to send notification.");
          }
          console.log(`Reservation accepted for slot ${slotId}.`);
          alert(`Reservation accepted for ${userName} at slot ${slotId + 1}.`);

          // Add a new document to the resStatus collection
          const resStatusDocRef = doc(collection(db, "resStatus"));
          await setDoc(resStatusDocRef, {
              userName,
              userEmail: userEmail || 'N/A', // Ensure email is not undefined
              carPlateNumber,
              slotId,
              floorTitle,
              status: "Occupied",
              timestamp: new Date(),
              resStatus: "Accepted",
              managementName: user.managementName,
          }, { merge: true });

      } catch (error) {
          console.error("Error accepting reservation and updating slotData:", error);
          alert("Failed to accept the reservation. Please try again.");
      }
  } else {
      try {
          const reservationDocRef = doc(db, "reservations", id);
          await setDoc(reservationDocRef, { status: "Declined" }, { merge: true });

          console.log(`Reservation declined for ${userName}.`);
          alert(`Reservation declined for ${userName}.`);

          const resStatusDocRef = doc(collection(db, "resStatus"));
          await setDoc(resStatusDocRef, {
              userName,
              userEmail: userEmail || 'N/A', // Ensure email is not undefined
              carPlateNumber,
              slotId,
              floorTitle,
              status: "Occupied",
              timestamp: new Date(),
              resStatus: "Declined",
              managementName: user.managementName,
          });
          await deleteDoc(reservationDocRef);
          
          // Fetch the user token from Firestore for declined case
          if (userEmail) {
              const userTokenDocRef = doc(db, "userTokens", userEmail);
              const docSnap = await getDoc(userTokenDocRef);
              if (docSnap.exists()) {
                  const { token } = docSnap.data();
                  const notificationData = {
                      appId: 24190,
                      appToken: '7xmUkgEHBQtdSvSHDbZ9zd',
                      title: 'Reservation',
                      message: `Your reservation at ${user.managementName} on ${floorTitle} ${slotId + 1} was declined`,
                      targetUsers: [token], // Send to device token
                      subID: userEmail
                  };

                  console.log("Sending notification with data:", JSON.stringify(notificationData));
                  fetch('https://app.nativenotify.com/api/indie/notification', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${notificationData.appToken}`
                      },
                      body: JSON.stringify(notificationData)
                  })
                  .then(response => response.text())
                  .then(text => {
                      if (text === "Success!") {
                          console.log('Notification sent successfully:', text);
                          alert('Notification sent successfully.');
                      } else {
                          try {
                              const data = JSON.parse(text);
                              console.log('Notification sent:', data);
                              alert('Notification sent successfully.');
                          } catch (error) {
                              console.error('Response received but not in expected format:', text);
                              alert(`Received unexpected response format. Response was: ${text}`);
                          }
                      }
                  })
                  .catch(error => {
                      console.error('Error sending notification:', error);
                      alert('Failed to send notification. Check the console for more details.');
                  });
              } else {
                  console.error("Error: No device token found for userEmail.");
                  alert("No device token found for the email.");
              }
          } else {
              console.error("Error: userEmail is null or undefined.");
              alert("No valid email to send notification.");
          }
          
      } catch (error) {
          console.error("Error updating reservation status:", error);
          alert("Failed to update the reservation status. Please try again.");
      }
  }
  const updatedRequests = reservationRequests.filter((_, i) => i !== index);
  setReservationRequests(updatedRequests);

  if (accepted) {
      localStorage.setItem("reservationRequests", JSON.stringify(updatedRequests));
  }
};

    
    const [showNotification, setShowNotification] = useState(false);

    const HistoryLog = ({ historyLog }) => {
        const [showAccepted, setShowAccepted] = useState(false);
        const [showDeclined, setShowDeclined] = useState(false);
    
        const handleClearHistory = () => {
            localStorage.removeItem("historyLog");
        };
    
        return (
        <div style={{
          marginTop: '-95px',
          border: "3px solid #7abdea",
          borderRadius: "8px",
          padding: "10px",
          maxWidth: '40vw',
          height: '50vh',
          boxSizing: 'border-box',
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          overflowY: 'auto',
          marginLeft: '-120px'
              }}>
                <h5 style={{ 
                  color: "#003851", 
                  textAlign: "left", 
                  fontSize: "1.5rem", 
                  fontWeight: "bold", 
                  marginBottom: "1.5rem",
                  
                }}>
                  Reservation History
                </h5>
                <hr className="divider" />
                <div style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  
                }}>
                            <div>
                <button
                    className="btn btn-primary"
                    style={{ margin: "5px", width: "150px" }}
                    onClick={() => setShowAccepted(!showAccepted)}
                >
                    {showAccepted ? "Hide Accepted" : "Show Accepted"}
                </button>
                <button
                    className="btn btn-primary"
                    style={{ margin: "5px", width: "150px" }}
                    onClick={() => setShowDeclined(!showDeclined)}
                >
                    {showDeclined ? "Hide Declined" : "Show Declined"}
                </button>
                <button
                    className="btn btn-danger"
                    style={{ margin: "5px", width: "150px" }}
                    onClick={handleClearHistory}
                >
                    Clear History
                </button>
            </div>
            <hr className="divider" />

            <div>
                <h6 className="mt-3">Filter by Date</h6>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <label>Start Date: </label>
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            dateFormat="yyyy/MM/dd"
                            isClearable
                        />
                    </div>
                    <div>
                        <label>End Date: </label>
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            dateFormat="yyyy/MM/dd"
                            isClearable
                        />
                    </div>
                </div>
            </div>

            {showAccepted && (
                <div>
                    <h6 className="mt-3">Accepted Reservations</h6>
                    {historyLog.filter(logEntry => logEntry.status === "Accepted" && filterByDate(logEntry)).map((logEntry, index) => (
                        <div className="alert alert-success mt-2" key={index}>
                            <strong>Accepted:</strong> {logEntry.name} requested a reservation on {logEntry.slotId}. Plate Number: {logEntry.plateNumber}, Slot: {logEntry.slotId}
                        </div>
                    ))}
                </div>
            )}
            {showDeclined && (
                <div>
                    <h6 className="mt-3">Declined Reservations</h6>
                    {historyLog.filter(logEntry => logEntry.status === "Declined" && filterByDate(logEntry)).map((logEntry, index) => (
                        <div className="alert alert-danger mt-2" key={index}>
                            <strong>Declined:</strong> {logEntry.name} requested a reservation on {logEntry.slotId}. Plate Number: {logEntry.plateNumber}, Slot: {logEntry.slotId}
                        </div>
                    ))}
                </div>
            )}
        </div>
        </div>
          
            
        );
    };

    const ReservationRequest = ({ request, index }) => {
        const [showMapModal, setShowMapModal] = useState(false);
      
        const toggleMapModal = () => {
          setShowMapModal(!showMapModal);
        };
      
        return (
          <div className="reservation-request mb-4 border p-3 rounded bg-light" style={{ maxWidth: '800px' }} key={request.plateNumber}>
            {/* Headers */}
            <div className="d-flex justify-content-between mb-2 text-muted">
              <div className="p-2"><strong>Name</strong></div>
              <div className="p-2"><strong>Time of Request</strong></div>
              <div className="p-2"><strong>Plate Number</strong></div>
              <div className="p-2"><strong>Floor</strong></div>
              <div className="p-2"><strong>Slot Number</strong></div>
            </div>
      
            {/* Details */}
            <div className="d-flex justify-content-between mb-2">
              <div className="p-2">{request.userName}</div>
              <div className="p-2">{request.timeOfRequest}</div>
              <div className="p-2">{request.carPlateNumber}</div>
              <div className="p-2">{request.floorTitle}</div>
              <div className="p-2">{request.slotId + 1}</div>
            </div>
        {/* MA CLICK NGA ICON SA MAP */}
        <Button variant="primary" onClick={toggleMapModal}>
          <i className="bi bi-geo-alt"></i> View Map
        </Button>

        {/* PARA SA MAP*/}
        <Modal show={showMapModal} onHide={toggleMapModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Map</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${request.latitude},${request.longitude}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7Clabel:S%7C${request.latitude},${request.longitude}&key=YOUR_API_KEY`}
              alt="Map"
              style={{ width: "100%", height: "auto" }}
            /> */}
            {request?.location && user.coordinates && (
              <MapComponent
                origin={request.location}
                destination={user.coordinates}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={toggleMapModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Buttons */}
        <div className="d-flex flex-row align-items-center mt-2">
          <button
            className="btn btn-success mr-2"
            onClick={() => handleReservation(true, request, index)}
          >
            Accept Reservation
          </button>
          <button
            className="btn btn-danger"
            onClick={() => handleReservation(false, request, index)}
          >
            Decline Reservation
          </button>
        </div>
      </div>
    );
  };

      

    return (
        <div>
        <section
            style={{
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                backgroundColor: "white", // Set a background color in case the image is not fully loaded
            }}
        >
            <div>
                
            <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#132B4B"}}>
    <div className="container d-flex justify-content-between">
        <a className="navbar-brand" style={{padding: 35}}>
            
        </a>
        <div>
            <button className="btn" onClick={() => setShowNotification(!showNotification)} style={{ color: 'white', border: 'none', background: 'none' }}>
                <FontAwesomeIcon icon={faBell} size="lg" />
                {/* Optionally display a badge with notification count */}
                {showNotification && <span className="badge rounded-pill bg-danger">3</span>}
            </button>
        </div>
    </div>
</nav>
{/* <div className="main-content">
                        <div className="summary-cards">
                            {summaryCardsData.map(card => (
                                <div key={card.title} className={`card card-${card.cardType}`} onClick={() => handleCardClick(card.cardType)}>
                                    <img src={card.imgSrc} alt={card.title} className="card-image" />
                                    <div className="card-content">
                                        <div className="card-title">{card.title}</div>
                                        <div className="card-value">{card.value}</div>
                                    </div>    
                                </div>
                            ))}
                        </div>
                        </div>
                        {renderFormBasedOnCardType()}      */}
                        <hr className="divider" />
                          
                <MDBContainer className="py-4">
                    <MDBRow>
                        <MDBCol lg="4">
                            <OperatorReserve />
                        </MDBCol>
                    
                        <MDBCol lg="4">
                    <div >
                   
                    <h3 style={{
                      color: "#003851",
                      textAlign: "center",
                      fontSize: "1.5rem",        // Keep rem for scalable font size
                      fontWeight: "bold",
                      marginBottom: "1.5rem",  // Use rem to maintain scalable spacing
                      marginLeft: '-60vh',         // Avoid negative margins that cause overflow
                      marginTop: '0'           // Adjust this to suit your layout needs
                    }}>
                      Parking Reservation Management
                    </h3>
                    
                    <div style={{
                    width: "100%",           // Use percentage to make the width responsive
                    height: "40vh",          // Use vh for a responsive height based on the viewport
                    overflowY: "scroll",
                    padding: "1rem",         // Use rem for padding to scale with the font size
                    background: "#132B4B",
                    marginLeft: '-30vh',         // Explicitly set marginLeft to 0 to ensure it aligns left
                  }}>
                  
                        {reservationRequests.length === 0 ? (
                            <p>No reservation</p>
                        ) : (
                            reservationRequests.map((request, index) => (
                                <ReservationRequest
                                    request={request}
                                    index={index}
                                    key={index}
                                    slotIndex={request.slotId} // Pass the slotId as slotIndex
                                />
                            ))
                        )}
                        
                    </div>
                </div>
              </MDBCol>
              <MDBCol lg="4">
                <nav
                  style={{
                    backgroundColor: "white",
                    marginLeft: "auto",
                    borderWidth: 1,
                    borderColor: "#003851",
                    marginTop: "26%",
                  }}
                >
                  <HistoryLog historyLog={historyLog} />
                </nav>
              </MDBCol>
            </MDBRow>
          </MDBContainer>
        </div>
      </section>

      <div></div>
    </div>
  );
};

export default Reservation;
