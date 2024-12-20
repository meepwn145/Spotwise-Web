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
  updateDoc,
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

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { fetchMultipleReservations, timeOptions } from "../helper/helper";

const Reservation = () => {
  const { user } = useContext(UserContext);
  const [reservationRequests, setReservationRequests] = useState([]);
  const [historyLog, setHistoryLog] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [slotSets, setSlotSets] = useState([]);
  const [agent, setAgent] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeTab, setActiveTab] = useState("reservation");
  const [mapModal, setMapModal] = useState({ show: false, data: null });
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const toggleImageModal = () => {
    setShowImageModal(!showImageModal);
  };
  
  const openImageModal = (url) => {
    setImageUrl(url);
    toggleImageModal();
  };
  
  useEffect(() => {
    console.log("Map Modal Data:", mapModal.data);
    console.log("User Coordinates:", user?.coordinates);
}, [mapModal]);

const toggleMapModal = (data) => {
  if (data?.currentLocation) {
      setMapModal({ show: true, data });
  } else {
      console.error("Invalid map data:", data);
      setMapModal({ show: false, data: null });
  }
};



  const filterByDate = (logEntry) => {
    if (startDate && endDate) {
      const reservationDate = new Date(logEntry.date);
      return reservationDate >= startDate && reservationDate <= endDate;
    }
    return true;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "notifications"),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const notification = change.doc.data();

            // Display the notification on your web app
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const renderTabContent = () => {
    
    switch (activeTab) {
      case "reservation":
        if (reservationRequests.length === 0) {
          return <p className="text-center mt-4">No pending Reservation.</p>;
        }
        return (
          
          <table className="table table-striped table-bordered" style={{ width: "100%" }}>
            <thead className="thead-light">
          <tr>
            <th style={{ minWidth: "150px", textAlign: "center" }}>Email</th>
            <th style={{ minWidth: "150px", whiteSpace: "nowrap", textAlign: "center" }}>
              Time of Requested
            </th>
            <th style={{ minWidth: "150px", whiteSpace: "nowrap", textAlign: "center" }}>
              Plate Number
            </th>
            <th style={{ minWidth: "100px", textAlign: "center" }}>Floor</th>
            <th style={{ minWidth: "150px", whiteSpace: "nowrap", textAlign: "center" }}>
              Slot Number
            </th>
            <th style={{ minWidth: "200px", textAlign: "center" }}>Actions</th>
          </tr>
            </thead>
            <tbody>
              {reservationRequests.map((request, index) => (
                <tr key={index}>
                  <td>{request.userEmail}</td>
                  <td>
                    {new Date(request.timestamp.seconds * 1000).toLocaleTimeString(
                      "en-US",
                      {
                        hour12: true,
                        hour: "numeric",
                        minute: "numeric",
                      }
                    )}
                  </td>
                  <td>{request.carPlateNumber}</td>
                  <td>{request.floorTitle}</td>
                  <td>{request.slotNumber}</td>
                  <td>
                    <div className="d-flex justify-content-start gap-2">
                    <Button
                    variant="primary"
                    className="me-2"
                    size="sm"
                    onClick={() => {
                      console.log("Request Data:", request);
                      toggleMapModal(request);
                    }}
                  >
                    View Map
                  </Button>
  
                      {/* Waiting for Payment / View Proof of Payment */}
                      <Button
                        variant="secondary"
                        onClick={() => openImageModal(request.imageUri)} // Pass the URL here
                        className="me-4 bg-green-600"
                        size="sm"
                        style={{
                          borderColor:
                            request.status === "Approval" ||
                            request.status === "Expired"
                              ? "#999999"
                              : "#16A34A",
                          backgroundColor:
                            request.status === "Approval" ||
                            request.status === "Expired"
                              ? "#999999"
                              : "#16A34A",
                        }}
                        disabled={
                          request.status === "Approval" ||
                          request.status === "Expired"
                        }
                      >
                        {request.status === "Approval"
                          ? "Waiting for Payment"
                          : request.status === "Expired"
                          ? "Expired"
                          : "View Proof of Payment"}
                      </Button>
  
                      {/* Approve */}
                      <Button
                        variant="success"
                        onClick={() =>
                          handleReservation(
                            true,
                            request,
                            index,
                            request.status === "Approval" ? false : true
                          )
                        }
                        className="me-4"
                        size="sm"
                        style={{
                          width: "120px",
                          borderColor:
                            request.status !== "Paid" &&
                            request.status !== "Approval" &&
                            request.status !== "Expired"
                              ? "#999999"
                              : "#16A34A",
                          backgroundColor:
                            request.status !== "Paid" &&
                            request.status !== "Approval" &&
                            request.status !== "Expired"
                              ? "#999999"
                              : "#16A34A",
                        }}
                        disabled={
                          request.status !== "Paid" &&
                          request.status !== "Approval" &&
                          request.status !== "Expired"
                            ? true
                            : false
                        }
                      >
                        {request.status === "Expired"
                          ? "Expired"
                          : reservationIsApprove
                          ? "Paid"
                          : "Approve"}
                      </Button>
  
                      {/* Decline Reservation */}
                      <Button
                        variant="danger"
                        onClick={() => handleReservation(false, request, index)}
                        size="sm"
                        style={{
                          borderColor: "#ff0000",
                          backgroundColor: "#ff0000",
                        }}
                      >
                        Decline Reservation
                      </Button>
                       {/* Map Modal */}
        <Modal show={mapModal.show} onHide={() => toggleMapModal(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Map</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {mapModal.data?.currentLocation && user?.coordinates ? (
              <MapComponent
              origin={mapModal.data.currentLocation} // Correct field here
              destination={user.coordinates}
              />
            ) : (
              <p>No map data available</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => toggleMapModal(null)}>
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
              <img
                src={imageUrl}
                alt="Reservation Image"
                style={{ width: "100%", height: "auto" }}
              />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
        case "accepted":
          return (
            <div>
              <h6 className="mt-3">Filter by Date</h6>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div style={{ marginRight: "30px" }}>
                  <label>Start Date:&nbsp;</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy/MM/dd"
                    isClearable
                  />
                </div>
                <div>
                  <label>End Date:&nbsp;</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy/MM/dd"
                    isClearable
                  />
                </div>
              </div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLog
                    .filter((log) => log.status === "Accepted" && filterByDate(log))
                    .map((log, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{log.name}</td>
                        <td>{log.status}</td>
                        <td>{log.date}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        case "declined":
          return (
            <div>
              <h6 className="mt-3">Filter by Date</h6>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div style={{ marginRight: "30px" }}>
                  <label>Start Date:&nbsp;</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy/MM/dd"
                    isClearable
                  />
                </div>
                <div>
                  <label>End Date:&nbsp;</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy/MM/dd"
                    isClearable
                  />
                </div>
              </div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLog
                    .filter((log) => log.status === "Declined" && filterByDate(log))
                    .map((log, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{log.name}</td>
                        <td>{log.status}</td>
                        <td>{log.date}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        
      default:
        return null;
    }
  };
  
  const fetchReservations = async (managementName) => {
    // console.log("Fetching reservations for managementName:", managementName);
    // const q = query(
    //   collection(db, "reservations"),
    //   where("managementName", "==", managementName)
    // );

    // const unsubscribe = fetchMultipleReservations(
    //   {
    //     collectionName: "reservations",
    //     conditions: [["managementName", "==", managementName]],
    //   },
    //   ({ data, error }) => {
    //     if (error) {
    //       console.error("Error fetching data:", error);
    //       // reservationInformation(null);
    //     } else if (data) {
    //       console.log("tutot");
    //       console.log(data[0]);
    //       // setreservationInformation(data[0]);
    //     }
    //   }
    // );
    // return () => unsubscribe();

    const queries = [
      {
        collectionName: "reservations",
        conditions: [["managementName", "==", managementName]],
      },
    ];

    const unsubscribeAll = fetchMultipleReservations(
      queries,
      ({ collectionName, data, error }) => {
        if (error) {
          return;
        }

        if (data) {
          setReservationRequests(data);
        } else {
        }
      }
    );

    // Cleanup on component unmount
    return () => {
      unsubscribeAll();
    };

    // try {
    //   const querySnapshot = await getDocs(q);
    //   const reservationPromises = querySnapshot.docs.map(
    //     async (reservationDoc) => {
    //       console.log("Reservation data:", reservationDoc.data());
    //       const slotId = reservationDoc.data().slotId;
    //       const userEmail = reservationDoc.data().userEmail;
    //       const floorTitle = reservationDoc.data().floorTitle;

    //       // Fetch the floor name from the slotData sub-document
    //       const slotDocRef = doc(
    //         db,
    //         "slot",
    //         managementName,
    //         "slotData",
    //         `slot_${slotId}`
    //       );
    //       const slotDocSnapshot = await getDoc(slotDocRef);

    //       // Fetch user data
    //       const userQuery = query(
    //         collection(db, "user"),
    //         where("email", "==", userEmail)
    //       );
    //       const userSnapshot = await getDocs(userQuery);
    //       const userData = userSnapshot.docs[0]?.data();

    //       setUserNames((prevUserNames) => ({
    //         ...prevUserNames,
    //         [userEmail]: userData?.name || "N/A",
    //       }));

    //       return {
    //         id: reservationDoc.id,
    //         name: reservationDoc.data().name,
    //         location: reservationDoc.data().currentLocation,
    //         imageUri: reservationDoc.data().imageUri,
    //         reservationId: reservationDoc.data().reservationId || "0",
    //         imageUri: reservationDoc.data().imageUri,
    //         userName: userData?.name || "N/A", // Add the userName property
    //         carPlateNumber: userData?.carPlateNumber || "N/A",
    //         slot: typeof slotId === "string" ? slotId.slice(1) : "N/A",
    //         slotId: slotId,
    //         floorTitle,
    //         userEmail,
    //         timeOfRequest: new Date(
    //           reservationDoc.data().timestamp.seconds * 1000
    //         ).toLocaleTimeString("en-US", {
    //           hour12: true,
    //           hour: "numeric",
    //           minute: "numeric",
    //         }),
    //         date: new Date(
    //           reservationDoc.data().timestamp.seconds * 1000
    //         ).toLocaleDateString("en-US"),
    //         status: reservationDoc.data().status,
    //       };
    //     }
    //   );
    //   const reservations = await Promise.all(reservationPromises);
    //   console.log("Fetched reservations:", reservations);
    //   setReservationRequests(reservations);
    // } catch (error) {
    //   console.error("Error fetching reservations:", error);
    // }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && user?.managementName) {
        fetchReservations(user.managementName);
      } else {
        setReservationRequests([]);
      }
    });

    return () => unsubscribe();
  }, [user?.managementName]);

  const [reservationIsApprove, setreservationIsApprove] = useState(false);

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
    const response = await fetch(
      `https://aapp.nativenotify.com/api/indie/notification/get-sub-id?email=${encodeURIComponent(
        email
      )}`,
      {
        headers: {
          Authorization: "Bearer YOUR_API_KEY",
        },
      }
    );
    const data = await response.json();
    return data.sub_id; // assuming the response contains `sub_id`
  };

  const [timerId, setTimerId] = useState(null);

  const handleReservation = async (
    accepted,
    reservationRequest,
    index,
    isPaid
  ) => {
    const {
      id,
      userName,
      carPlateNumber,
      slotId,
      timeOfRequest,
      floorTitle,
      userToken,
      userEmail,
      reservationId,
      slotNumber,
      continuousParkingFee,// Assuming these are part of reservationRequest
      gracePeriod,
    } = reservationRequest;
    if (accepted && !isPaid) {
      // Check if the slot is occupied
      const slotRef = doc(db, "slot", user.managementName, "slotData", `slot_${floorTitle}_${slotId}`);
      console.log("Checking slotRef path:", `slot_${floorTitle}_${slotId}`);
  
      try {
        const slotSnap = await getDoc(slotRef);
        if (slotSnap.exists()) {
          const slotData = slotSnap.data();
          if (slotData.status === 'Occupied') {
            console.error("Slot is already occupied. Document path: ", `slot_${floorTitle}_${slotId}`);
            alert("This slot is already occupied.");
            return; // Exit the function if the slot is occupied
          } else {
            console.log("Slot is not occupied, proceeding to accept the reservation.");
          }
        } else {
          console.log("Slot data does not exist, proceeding to accept reservation.");
        }
      } catch (error) {
        console.error("Error checking slot status:", error);
        return; // Exit the function if there's an error fetching slot data
      }
      const notificationData = {
              appId: 24190,
              appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
              title: "Reservation Approved",
              message: `Your reservation at ${user.managementName} on ${floorTitle} Slot ${slotId + 1} has been approved. Please upload a proof of payment before expiration`,
              targetUsers: [userEmail],
              color: "#16A34A",
              subID: userEmail,
            };
          
            fetch("https://app.nativenotify.com/api/indie/notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${notificationData.appToken}`,
              },
              body: JSON.stringify(notificationData),
            })
              .then((response) => response.text())
              .then((text) => {
                if (text === "Success!") {
                  console.log("Approval notification sent successfully.");
                } else {
                  console.error("Unexpected response for approval notification:", text);
                }
              })
              .catch((error) => {
                console.error("Error sending approval notification:", error);
              });
      
  
      // Set up the timer for reservation expiration if proof of payment is not provided
      const duration = reservationRequest.reservationDuration * 60000; // Convert minutes to milliseconds
      const endTime = Date.now() + duration;
  
      const interval = setInterval(async () => {
        const now = Date.now();
        const timeLeft = Math.max(endTime - now, 0);
  
        console.log(`Time remaining for reservation ${id}: ${Math.floor(timeLeft / 1000)} seconds`);
  
        if (timeLeft <= 0) {
          clearInterval(interval);
          const reservationRef = doc(db, "reservations", id);
          const snap = await getDoc(reservationRef);
  
          if (snap.exists() && snap.data().status === "Accepted" && (!snap.data().imageUri || snap.data().imageUri.trim() === "")) {
            await deleteDoc(reservationRef);
            console.log(`Reservation ${id} expired and was deleted due to no proof of payment.`);
  
            // Send expiration notification
            const expirationNotificationData = {
              appId: 24190,
              appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
              title: "Reservation Expired",
              message: `Your reservation at ${user.managementName} on ${floorTitle} Slot ${slotId + 1} has expired.`,
              targetUsers: [userEmail],
              color: "#FF0000",
              subID: userEmail,
            };
  
            fetch("https://app.nativenotify.com/api/indie/notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${expirationNotificationData.appToken}`,
              },
              body: JSON.stringify(expirationNotificationData),
            })
              .then((response) => response.text())
              .then((text) => {
                if (text === "Success!") {
                  console.log("Expiration notification sent successfully.");
                } else {
                  console.error("Unexpected response for expiration notification:", text);
                }
              })
              .catch((error) => {
                console.error("Error sending expiration notification:", error);
              });
          } else {
            console.log(`No action needed for reservation ${id}. It has either been paid or is no longer in an 'Accepted' state.`);
          }
        }
      }, 1000);
  
      setTimerId(interval); // Set the timer ID to the state
    }
    const status = accepted ? "Accepted" : "Declined";

    const logEntry = {
      status,
      name: userName,
      carPlateNumber,
      slotId,
      timeOfRequest,
      email: userEmail || "N/A",
      date: new Date().toLocaleDateString("en-US"),
    };

    setHistoryLog([logEntry, ...historyLog]);
    localStorage.setItem(
      "historyLog",
      JSON.stringify([logEntry, ...historyLog])
    );
    
  //   if (accepted && !isPaid) {
  //     const notificationData = {
  //       appId: 24190,
  //       appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
  //       title: "Reservation Approved",
  //       message: `Your reservation at ${user.managementName} on ${floorTitle} Slot ${slotId + 1} has been approved. Please upload a proof of payment before expiration`,
  //       targetUsers: [userEmail],
  //       color: "#16A34A",
  //       subID: userEmail,
  //     };
    
  //     fetch("https://app.nativenotify.com/api/indie/notification", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${notificationData.appToken}`,
  //       },
  //       body: JSON.stringify(notificationData),
  //     })
  //       .then((response) => response.text())
  //       .then((text) => {
  //         if (text === "Success!") {
  //           console.log("Approval notification sent successfully.");
  //         } else {
  //           console.error("Unexpected response for approval notification:", text);
  //         }
  //       })
  //       .catch((error) => {
  //         console.error("Error sending approval notification:", error);
  //       });

        
  //     const duration = reservationRequest.reservationDuration * 60000; // Convert minutes to milliseconds
  //     const endTime = Date.now() + duration;

  //     const interval = setInterval(async () => {
  //       const now = Date.now();
  //       const timeLeft = Math.max(endTime - now, 0);
  
  //       console.log(`Time remaining for reservation ${id}: ${Math.floor(timeLeft / 1000)} seconds`);

  //       if (timeLeft <= 0) {
  //         clearInterval(interval);
  //         const reservationRef = doc(db, "reservations", id);
  //         const snap = await getDoc(reservationRef);
  //         if (snap.exists()) {
  //           console.log("Reservation data before expiration check:", snap.data()); // Log full document data
  //           const imageUri = snap.data().imageUri;
  //           console.log("imageUri value:", imageUri); // Log the specific field
  //           console.log("Status value:", snap.data().status);
          
  //         }
  //         if (snap.exists() && snap.data().status === "Accepted" && (!snap.data().imageUri || snap.data().imageUri.trim() === "")) {
  //           await deleteDoc(reservationRef);
  //           console.log(`Reservation ${id} expired and was deleted due to no proof of payment.`);
  //         }   const notificationData = {
  //     appId: 24190,
  //     appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
  //     title: "Reservation Expired",
  //     message: `Your reservation at ${user.managementName} on ${floorTitle} Slot ${slotId + 1} has expired.`,
  //     targetUsers: [userEmail],
  //     color: "#FF0000",
  //     subID: userEmail,
  //   };

  //   fetch("https://app.nativenotify.com/api/indie/notification", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${notificationData.appToken}`,
  //     },
  //     body: JSON.stringify(notificationData),
  //   })
  //     .then((response) => response.text())
  //     .then((text) => {
  //       if (text === "Success!") {
  //         console.log("Expiration notification sent successfully.");
  //       } else {
  //         console.error("Unexpected response for expiration notification:", text);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error sending expiration notification:", error);
  //     });
  // } else {
  //   console.log(`No action needed for reservation ${id}.`);
  // }
  //     }, 1000);
  //     setTimerId(interval); 
  //   }
    
    
    if (isPaid) {
      console.log(`Floor Title: ${floorTitle}, Slot ID: ${slotId}`);
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }

        const slotData = {
      userDetails: {
        name: userName,
        carPlateNumber,
        slotId,
        floorTitle,
        userEmail,
        slotNumber,
        timestamp: new Date(),
        continuousParkingFee: continuousParkingFee || 0,  // Adding the continuousParkingFee
        gracePeriod: gracePeriod || 0,  
        parkingPay: reservationRequest.parkingPay,
      },
      from: "Reservation",
      reservationId: reservationId,
      status: "Occupied",
      reserveStatus: "Accepted",
      allocatedTimeForArrival: reservationRequest.allocatedTimeForArrival,
      timestamp: new Date(),
    };

    // Conditionally add continuousParkingFee and gracePeriod if they exist and are not null
    if (continuousParkingFee !== undefined && continuousParkingFee !== null) {
      slotData.continuousParkingFee = continuousParkingFee;
    }
    if (gracePeriod !== undefined && gracePeriod !== null) {
      slotData.gracePeriod = gracePeriod;
    }

    // Update the slot document in Firestore
    const slotDocRef = doc(
      db,
      "slot",
      user.managementName,
      "slotData",
      `slot_${floorTitle}_${slotId}`
    );

    await setDoc(
      slotDocRef,
      slotData,
      { merge: true }
    );
    

    const paymentRecordRef = doc(db, "reports", user.managementName, "daily", `slot_${floorTitle}_${slotId}`);
    await setDoc (
      paymentRecordRef,
      slotData,
      {merge: true}
    );

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
            appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
            title: "Reservation Approved",
            message: `Your reservation at ${
              user.managementName
            } on ${floorTitle} ${slotId + 1} is accepted`,
            targetUsers: [token], // Send to device token
            subID: userEmail,
            color: "#FF0000FF",
          };
          fetch("https://app.nativenotify.com/api/indie/notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${notificationData.appToken}`,
            },
            body: JSON.stringify(notificationData),
          })
            .then((response) => response.text())
            .then((text) => {
              if (text === "Success!") {
                alert("Notification sent successfully.");
              } else {
                try {
                  const data = JSON.parse(text);

                  alert("Notification sent successfully.");
                } catch (error) {
                  console.error(
                    "Response received but not in expected format:",
                    text
                  );
                  alert(
                    `Received unexpected response format. Response was: ${text}`
                  );
                }
              }
            })
            .catch((error) => {
              console.error("Error sending notification:", error);
              alert(
                "Failed to send notification. Check the console for more details."
              );
            });
        } else {
          console.error("Error: No device token found for userEmail.");
          alert("No device token found for the email.");
        }
      } else {
        console.error("Error: userEmail is null or undefined.");
        alert("No valid email to send notification.");
      }

      alert(`Reservation accepted for ${userName} at slot ${slotId + 1}.`);
      // Add a new document to the resStatus collection
      const resStatusDocRef = doc(collection(db, "resStatus"));
      await setDoc(
        resStatusDocRef,
        {
          userName,
          userEmail: userEmail || "N/A", // Ensure email is not undefined
          carPlateNumber,
          slotId,
          floorTitle,
          status: "Occupied",
          reservationId: reservationId,
          timestamp: new Date(),
          resStatus: "Accepted",
          managementName: user.managementName,
        },
        { merge: true }
      );
    } else if (accepted) {
      try {
        const q = query(
          collection(db, "reservations"),
          where("userEmail", "==", userEmail)
        );

        const result = await getDocs(q);

        if (!result.empty) {
          const docRef = result.docs[0].ref;

          await updateDoc(docRef, { status: "Accepted" });

          alert(`Reservation is approved`);
          setreservationIsApprove(true);
        }
      } catch (error) {
        console.error(
          "Error accepting reservation and updating slotData:",
          error
        );
        alert("Failed to accept the reservation. Please try again.");
      }
    } else {
      try {
        const reservationDocRef = doc(db, "reservations", id);
        await setDoc(
          reservationDocRef,
          { status: "Declined" },
          { merge: true }
        );
        console.log(`Reservation declined for ${userName}.`);
        alert(`Reservation declined for ${userName}.`);
        const resStatusDocRef = doc(collection(db, "resStatus"));
        await setDoc(resStatusDocRef, {
          userName,
          userEmail: userEmail || "N/A", // Ensure email is not undefined
          carPlateNumber,
          slotId,
          floorTitle,
          status: "Occupied",
          reservationId: reservationId,
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
              appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
              title: "Reservation Declined",
              message: `Your reservation at ${
                user.managementName
              } on ${floorTitle} ${slotId + 1} was declined`,
              targetUsers: [token], // Send to device token
              subID: userEmail,
            };
            console.log(
              "Sending notification with data:",
              JSON.stringify(notificationData)
            );
            fetch("https://app.nativenotify.com/api/indie/notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${notificationData.appToken}`,
              },
              body: JSON.stringify(notificationData),
            })
              .then((response) => response.text())
              .then((text) => {
                if (text === "Success!") {
                  console.log("Notification sent successfully:", text);
                  alert("Notification sent successfully.");
                } else {
                  try {
                    const data = JSON.parse(text);
                    console.log("Notification sent:", data);
                    alert("Notification sent successfully.");
                  } catch (error) {
                    console.error(
                      "Response received but not in expected format:",
                      text
                    );
                    alert(
                      `Received unexpected response format. Response was: ${text}`
                    );
                  }
                }
              })
              .catch((error) => {
                console.error("Error sending notification:", error);
                alert(
                  "Failed to send notification. Check the console for more details."
                );
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

    if (!isPaid) {
      localStorage.setItem(
        "reservationRequests",
        JSON.stringify(updatedRequests)
      );
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
    const [timeLeft, setTimeLeft] = useState(null);

    

    const toggleImageModal = () => {
      setShowImageModal(!showImageModal);
    };

    const openImageModal = () => {
      setImageUrl(request.imageUri);
      toggleImageModal();
    };

    return (
      <div
        className="reservation-request mb-4 border p-3 rounded bg-light"
        style={{ maxWidth: "100%" }}
        key={request.userEmail}
      >
           
        {/* Map Modal */}
        <Modal show={mapModal.show} onHide={() => toggleMapModal(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Map</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {mapModal.data?.currentLocation && user?.coordinates ? (
              <MapComponent
              origin={mapModal.data.currentLocation} // Correct field here
              destination={user.coordinates}
              />
            ) : (
              <p>No map data available</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => toggleMapModal(null)}>
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
              <img
                src={imageUrl}
                alt="Reservation Image"
                style={{ width: "100%", height: "auto" }}
              />
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
                style={{ color: "white", border: "none", background: "none" }}
              >
                <FontAwesomeIcon icon={faBell} size="lg" />
                {showNotification && (
                  <span className="badge rounded-pill bg-danger">3</span>
                )}
              </button>
            </div>
          </div>

          <MDBContainer className="py-6">
            <MDBRow>
              <MDBCol lg="2">
                <OperatorReserve />
              </MDBCol>
              <MDBCol lg="10">
                <h3 className="text-center mb-4">
                  Parking Reservation Management
                </h3>
                <div className="d-flex justify-content-center mb-3">
                  <button
                    className={`btn tab-button ${
                      activeTab === "reservation"
                        ? "active-reservation"
                        : "inactive"
                    }`}
                    onClick={() => setActiveTab("reservation")}
                  >
                    Show Reservation
                  </button>
                  <button
                    className={`btn tab-button ${
                      activeTab === "accepted" ? "active-accepted" : "inactive"
                    }`}
                    onClick={() => setActiveTab("accepted")}
                  >
                    Show Accepted
                  </button>
                  <button
                    className={`btn tab-button ${
                      activeTab === "declined" ? "active-declined" : "inactive"
                    }`}
                    onClick={() => setActiveTab("declined")}
                  >
                    Show Declined
                  </button>
                </div>

                <div>{renderTabContent()}</div>
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