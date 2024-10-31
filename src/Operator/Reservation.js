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
    const [activeTab, setActiveTab] = useState("reservation");

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

      const renderTabContent = () => {
        switch (activeTab) {
            case "reservation":
                if (reservationRequests.length === 0) {
                    return <p className="text-center mt-4">No pending Reservation.</p>;
                }
                return reservationRequests.map((request, index) => (
                    <ReservationRequest key={index} request={request} index={index} />
                ));
            case "accepted":
                return (
                    <div>
                        <h6 className="mt-3">Filter by Date</h6>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ marginRight: '30px' }}>
                                <label>Start Date:&nbsp;</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={date => setStartDate(date)}
                                    dateFormat="yyyy/MM/dd"
                                    isClearable
                                />
                            </div>
                            <div>
                                <label>End Date:&nbsp;</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={date => setEndDate(date)}
                                    dateFormat="yyyy/MM/dd"
                                    isClearable
                                />
                            </div>
                        </div>
                        {historyLog
                            .filter((log) => log.status === "Accepted" && filterByDate(log))
                            .map((log, index) => (
                                <div className="alert alert-success mt-2" key={index}>
                                    {log.name} - Accepted on {log.date}
                                </div>
                            ))}
                    </div>
                );
            case "declined":
                return (
                    <div>
                        <h6 className="mt-3">Filter by Date</h6>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ marginRight: '30px' }}>
                                <label>Start Date:&nbsp;</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={date => setStartDate(date)}
                                    dateFormat="yyyy/MM/dd"
                                    isClearable
                                />
                            </div>
                            <div>
                                <label>End Date:&nbsp;</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={date => setEndDate(date)}
                                    dateFormat="yyyy/MM/dd"
                                    isClearable
                                />
                            </div>
                        </div>
                        {historyLog
                            .filter((log) => log.status === "Declined" && filterByDate(log))
                            .map((log, index) => (
                                <div className="alert alert-danger mt-2" key={index}>
                                    {log.name} - Declined on {log.date}
                                </div>
                            ))}
                    </div>
                );
            default:
                return null;
        }
    };
    
    
    const fetchReservations = async (managementName) => {
        console.log("Fetching reservations for managementName:", managementName);
        const q = query(collection(db, "reservations"), where("managementName", "==", managementName));
        try {
            const querySnapshot = await getDocs(q);
            const reservationPromises = querySnapshot.docs.map(async (reservationDoc) => {
              console.log("Reservation data:", reservationDoc.data()); 
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
            imageUri: reservationDoc.data().imageUri,
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
        
    };

    const ReservationRequest = ({ request, index }) => {
        const [showMapModal, setShowMapModal] = useState(false);
        const [showImageModal, setShowImageModal] = useState(false);
        const [imageUrl, setImageUrl] = useState("");

        const toggleMapModal = () => {
          setShowMapModal(!showMapModal);
        };

        const toggleImageModal = () => {
          setShowImageModal(!showImageModal);
      };

      const openImageModal = () => {
        console.log("Image URL:", request.imageUri); // Log the URL to check its validity
        setImageUrl(request.imageUri);
        toggleImageModal();
    };
      
    return (
      <div className="reservation-request mb-4 border p-3 rounded bg-light" style={{maxWidth: '100%' }} key={request.plateNumber}>
      {/* Headers */}
      <div className="d-flex justify-content-between mb-2 text-muted">
        <div className="p-2"><strong>Name</strong></div>
        <div className="p-2"><strong>Time of Request</strong></div>
        <div className="p-2"><strong>Plate Number</strong></div>
        <div className="p-2"><strong>Floor</strong></div>
        <div className="p-2"><strong>Slot Number</strong></div>
      </div>
    
      {/* Details Row */}
      <div className="d-flex justify-content-between mb-2">
        <div className="p-2">{request.userName}</div>
        <div className="p-2">{request.timeOfRequest}</div>
        <div className="p-2">{request.carPlateNumber}</div>
        <div className="p-1">{request.floorTitle}</div>
        <div className="p-2">{request.slotId + 1}</div>
      </div>
    
      {/* Slot Number and Action Buttons Row */}
      <div className="d-flex align-items-center">
        <div className="ms-auto d-flex">
          <Button variant="primary" onClick={toggleMapModal} className="me-4" size="sm">
            View Map
          </Button>
          <Button variant="secondary" onClick={openImageModal} className="me-4" size="sm">
            View Proof of Payment
          </Button>
          <Button
            variant="success"
            onClick={() => handleReservation(true, request, index)}
            className="me-4"
            size="sm"
          >
            Accept Reservation
          </Button>
          <Button
            variant="danger"
            onClick={() => handleReservation(false, request, index)}
            size="sm"
          >
            Decline Reservation
          </Button>
        </div>
      </div>
    
      {/* Map Modal */}
      <Modal show={showMapModal} onHide={toggleMapModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Map</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
    
      {/* Image Modal */}
      <Modal show={showImageModal} onHide={toggleImageModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Proof of Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {imageUrl ? (
            <img src={imageUrl} alt="Reservation Image" style={{ width: "100%", height: "auto" }} />
          ) : (
            <p>Loading image...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={toggleImageModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
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
                backgroundColor: "white",
            }}
        >
            <div>
                <div className="container d-flex justify-content-between">
                    <a className="navbar-brand" style={{ padding: 35 }}></a>
                    <div>
                        <button
                            className="btn"
                            onClick={() => setShowNotification(!showNotification)}
                            style={{ color: 'white', border: 'none', background: 'none' }}
                        >
                            <FontAwesomeIcon icon={faBell} size="lg" />
                            {showNotification && <span className="badge rounded-pill bg-danger">3</span>}
                        </button>
                    </div>
                </div>

                <MDBContainer className="py-6">
                    <MDBRow>
                        <MDBCol lg="2">
                            <OperatorReserve />
                        </MDBCol>
                        <MDBCol lg="10">
                            <h3 className="text-center mb-4">Parking Reservation Management</h3>
                            <div className="d-flex justify-content-center mb-3">
                                <button
                                    className={`btn tab-button ${activeTab === "reservation" ? "active-reservation" : "inactive"}`}
                                    onClick={() => setActiveTab("reservation")}
                                >
                                    Show Reservation
                                </button>
                                <button
                                    className={`btn tab-button ${activeTab === "accepted" ? "active-accepted" : "inactive"}`}
                                    onClick={() => setActiveTab("accepted")}
                                >
                                    Show Accepted
                                </button>
                                <button
                                    className={`btn tab-button ${activeTab === "declined" ? "active-declined" : "inactive"}`}
                                    onClick={() => setActiveTab("declined")}
                                >
                                    Show Declined
                                </button>
                            </div>
                            <MDBCard>
                                <MDBCardBody>
                                    <div>{renderTabContent()}</div>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                        <MDBCol lg="4">
                            <HistoryLog historyLog={historyLog} />
                        </MDBCol>
                    </MDBRow>
                </MDBContainer>
            </div>
        </section>
    </div>
);
                            };
export default Reservation;
