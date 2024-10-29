import React, { useState, useEffect, useContext, useMemo} from 'react';
import { Button, Modal, Form, Tab, Nav} from 'react-bootstrap';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Link, } from 'react-router-dom';
import { FaUserCircle, FaBars, FaBell,  } from "react-icons/fa";
import { db } from "../config/firebase";
import { collection, getDocs, query, where, serverTimestamp,addDoc, setDoc, doc, getDoc, onSnapshot, deleteDoc} from 'firebase/firestore';
import SearchForm from './SearchForm';
import UserContext from '../UserContext';
import { useNavigate } from 'react-router-dom';
import { faB, faBell } from '@fortawesome/free-solid-svg-icons'
import './DashboardOp.css';
import './space.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import Card from 'react-bootstrap/Card';
import { ToastContainer, toast } from 'react-toastify';

const ParkingSlot = () => {
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
      const { user } = useContext(UserContext);
  const maxZones = 5;
  const initialSlotSets = [{ title: 'Zone 1', slots: Array(15).fill(false) }];
  const [parkingPay, setParkingPay] = useState(0);
  const initialTotalSpaces = initialSlotSets.map(zone => zone.slots.length).reduce((total, spaces) => total + spaces, 0);
  const [showButtons, setShowButtons] = useState(false); 
  const [showConfirmation, setShowConfirmation] = useState(false); 
  const [slotSets, setSlotSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const totalParkingSpaces = slotSets.reduce((total, slotSet) => total + slotSet.slots.length, 0);
const availableParkingSpaces = slotSets.reduce((available, slotSet) => {
  return available + slotSet.slots.filter(slot => !slot.occupied).length;
}, 0);

const saveSlotsToLocalStorage = (managementName, slots) => {
  try {
    localStorage.setItem(`slotSets_${managementName}`, JSON.stringify(slots));
    console.log('Saved slots to local storage for:', managementName);
  } catch (error) {
    console.error('Error saving slots to local storage:', error);
  }
};

const loadSlotsFromLocalStorage = (managementName) => {
  try {
    const savedSlots = localStorage.getItem(`slotSets_${managementName}`);
    return savedSlots ? JSON.parse(savedSlots) : [];
  } catch (error) {
    console.error('Error loading slots from local storage:', error);
    return [];
  }
};

useEffect(() => {
    
  const fetchEstablishmentData = async () => {
    try {
      
      const q = query(collection(db, 'establishments'), where('managementName', '==', user.managementName));
      const querySnapshot = await getDocs(q);

      console.log(`Found ${querySnapshot.docs.length} documents`); 

      if (!querySnapshot.empty) {
        const establishmentData = querySnapshot.docs[0].data(); 
        console.log('Establishment Data:', establishmentData); 
        setParkingPay(establishmentData.parkingPay);
      } else {
        console.log('No matching establishment found!');
      }
    } catch (error) {
      console.error('Error fetching establishment data:', error);
    }
  };

  if (user && user.managementName) {
    fetchEstablishmentData();
  }
}, [user]);


const [notifications, setNotifications] = useState([]);
const [showNotification, setShowNotification] = useState(false);
const [notificationCount, setNotificationCount] = useState(0);
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'notifications'),
      where("managementName", "==", user.managementName)
    ),
    (snapshot) => {
      const fetchedNotifications = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          fetchedNotifications.push({ ...change.doc.data(), id: change.doc.id });
        }
        if (change.type === "removed") {
          setNotifications(notifications.filter(n => n.id !== change.doc.id));
        }
      });
      setNotifications(fetchedNotifications);
      setNotificationCount(fetchedNotifications.length);
    }
  );

  return () => unsubscribe();
}, [user?.managementName]);

const handleNotificationClick = async (notificationId) => {
  setShowNotification(!showNotification); 
  setNotifications([]);
  navigate("/Reservation");
  if (!showNotification) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      setNotifications(notifications.filter(notification => notification.id !== notificationId));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }
};


useEffect(() => {
  let fetchedSlotData = new Map();
  // Fetch slot data
  const fetchSlotData = async () => {
    const slotDataQuery = query(collection(db, 'slot', user.managementName, 'slotData'));
    const slotDataSnapshot = await getDocs(slotDataQuery);
    slotDataSnapshot.forEach((doc) => {
      fetchedSlotData.set(doc.id, { ...doc.data(), occupied: doc.data().status === 'Occupied' });
    });
  };

  const updateSlots = () => {
    setSlotSets(currentSlotSets =>
      currentSlotSets.map(slotSet => {
       
        const floorOrZone = slotSet.title.replace(/\s+/g, '_'); 
        return {
          ...slotSet,
          slots: slotSet.slots.map((slot, index) => {
            
            const slotId1 = `slot_${slotSet.title}_${index}`;
            const slotId = floorOrZone === 'General_Parking'
              ? `General Parking_${index + 1}` 
              : `${floorOrZone}_${slot.slotNumber || index + 3}`; 
            const slotData = fetchedSlotData.get(slotId1);
            const isOccupied = (slotData && slotData.occupied);
            return {
              ...slot,
              occupied: isOccupied,
              userDetails: isOccupied
                ? { 
                    // Show carPlateNumber from resData if available, otherwise from slotData
                    carPlateNumber: slotData?.userDetails?.carPlateNumber
                  }
                : undefined,
            };
          }),
        };
      })
    );
  };

  
  const fetchDataAndUpdateSlots = async () => {
    await fetchSlotData();
    updateSlots();
  };

  // Run the async function
  fetchDataAndUpdateSlots();

}, [db, user.managementName]);


useEffect(() => {
  const managementName = user?.managementName;
  if (managementName) {
    const savedSlots = loadSlotsFromLocalStorage(managementName);
    if (savedSlots.length > 0) {
      console.log('Loaded slots from local storage:', savedSlots);
      setSlotSets(savedSlots);
    }
    fetchData(managementName); // Always fetch to ensure you have the latest data.
  }
}, [user?.managementName]);

const savedSlots = useMemo(() => loadSlotsFromLocalStorage(), []);

const fetchData = async (managementName) => {
  if (!user || !user.managementName) {
    console.log('No user logged in or management name is missing');
    return;
  }

  setIsLoading(true);

  try {
    const slotDocRef = doc(db, 'slot', managementName);
    const slotCollectionRef = collection(slotDocRef, 'slotData');
    const slotsSnapshot = await getDocs(slotCollectionRef);
    const occupiedSlots = new Map();
    slotsSnapshot.forEach(doc => {
      const data = doc.data();
      occupiedSlots.set(doc.id, data);
    });

    const establishmentRef = collection(db, 'establishments');
    const q = query(establishmentRef, where('managementName', '==', managementName));
    const establishmentSnapshot = await getDocs(q);
    
    if (!establishmentSnapshot.empty) {
      const establishmentData = establishmentSnapshot.docs[0].data();
      let newSlotSets = [];

      // Check if floorDetails exist and handle them accordingly
      if (establishmentData.floorDetails && establishmentData.floorDetails.length > 0) {
        // Floor details provided as an array
        newSlotSets = establishmentData.floorDetails.map(floor => ({
          title: floor.floorName,
          slots: Array.from({ length: parseInt(floor.parkingLots) }, (_, i) => {
            const slotKey = `slot_${floor.floorName}_${i}`;
            const slotData = occupiedSlots.get(slotKey);
            return {
              id: i,
              occupied: !!slotData,
              userDetails: slotData ? slotData.userDetails : null
            };
          }),
        }));
      } else if (establishmentData.totalSlots) {
        // Only totalSlots provided, create a single generic floor
        newSlotSets = [{
          title: 'General Parking',
          slots: Array.from({ length: parseInt(establishmentData.totalSlots) }, (_, i) => {
            const slotKey = `slot_General Parking_${i}`;
            const slotData = occupiedSlots.get(slotKey);
            return {
              id: i,
              occupied: !!slotData,
              userDetails: slotData ? slotData.userDetails : null
            };
          }),
        }];
      }

      setSlotSets(newSlotSets);
      saveSlotsToLocalStorage(managementName, newSlotSets);
    } else {
      console.log('No such establishment found!');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setIsLoading(false);
  }
};


  
  useEffect(() => {
    const managementName = user?.managementName;
    if (managementName && slotSets.length > 0) {
      saveSlotsToLocalStorage(managementName, slotSets);
    }
  }, [slotSets, user?.managementName]); 

  
  
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [zoneAvailableSpaces, setZoneAvailableSpaces] = useState(
    initialSlotSets.map(zone => zone.slots.length)
  );
  const [currentTab, setCurrentTab] = useState(0); 
  
  useEffect(() => {
    const managementName = user?.managementName;
    if (managementName) {
      fetchSlots(managementName);
    }
  }, [user?.managementName]);


  const fetchSlots = async (managementName) => {
    const collectionRef = collection(db, 'establishments');
    const q = query(collectionRef, where('managementName', '==', managementName));

    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const establishmentData = snapshot.docs.map(doc => doc.data())[0];
        let newSlotSets = [];

        if (Array.isArray(establishmentData.floorDetails)) {
          newSlotSets = establishmentData.floorDetails.map(floor => ({
            title: floor.floorName,
            slots: Array.from({ length: floor.parkingLots }, (_, i) => ({
              id: i, occupied: false
            }))
          }));
        }

        setSlotSets(newSlotSets);
      } else {
        console.log('No such establishment!');
      }
    }, (error) => {
      console.error('Error fetching establishment data:', error);
    });
  };

  const handleTabSelect = (key) => {
    setCurrentTab(key);
  };

  const [recordFound, setRecordFound] = useState(true); 
  const [userFound, setUserFound] = useState(true);
  const searchInFirebase = async (searchInput) => {
    try {
      const collectionRef = collection(db, 'user');
      const q = query(collectionRef, where('carPlateNumber', '==', searchInput));
      const querySnapshot = await getDocs(q);
  
      const user = querySnapshot.docs.find(doc => doc.data().carPlateNumber === searchInput);
  
      if (user) {
        console.log('Found user:', user.data());
        setUserPlateNumber(user.data().carPlateNumber);
        setUserDetails(user.data());
        setUserFound(true);
      } else {
        console.log('User not found.');
        setUserDetails({}); 
        setUserPlateNumber(searchInput);
        setUserFound(false); 
      }
      setShowButtons(true); // Show Assign and Exit buttons regardless of search outcome
      setShowConfirmation(false); // 
    } catch (error) {
      console.error('Error:', error);
      setShowButtons(false);
    }
  };
  const navigate = useNavigate();

  const handleButtonClick = () => {
  navigate("/Reservation");
 };

  const rows = 5;
  const cols = 3;

  const handleNext = () => {
    if (currentSetIndex < slotSets.length - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex(currentSetIndex - 1);
    }
  };

  const [showModal, setShowModal] = useState(false); 
  const [selectedSlot, setSelectedSlot] = useState(null); 
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedPlateNumber, setSelectedPlateNumber] = useState(""); 
  const [agent, setAgentName] = useState (user.firstName || "");
  const [agentL, setAgentLName] = useState (user.lastName || "");
  const [managementName, setManagementName] = useState (user.managementName || "");
  const fullName = `${agent} ${agentL}`;
  const [errorMessage, setErrorMessage] = useState("");
  
  const addToLogs = async (userDetails, slotNumber) => {
    try {
      const logsCollectionRef = collection(db, 'logs',managementName, 'floors' ); 
      const timestamp = new Date();
      const logData = {
        ...userDetails,
        status: 'Occupied', // Add status to log data
        timeIn: timestamp,
        timeOut: null,
        agent: fullName,
        managementName: managementName,
      };
  
      const docRef = await addDoc(logsCollectionRef, logData);
      console.log('Log added with ID: ', docRef.id);
    } catch (error) {
      console.error('Error adding log: ', error);
    }
  };
  
  
  const [userDetails, setUserDetails] = useState({});
  const [userPlateNumber, setUserPlateNumber] = useState("");

  const handleAddToSlot = (carPlateNumber, slotIndex) => {
    if (!carPlateNumber || carPlateNumber.trim() === "") {
      setErrorMessage("Please enter a plate number.");
      return;
    }
    if (!userFound) {
      const confirmAssign = window.confirm("No record found. Do you want to proceed?");
      if (!confirmAssign) {
        return;
      }
    }
    const floorTitle = slotSets[currentSetIndex].title || "General Parking";
    const uniqueElement = new Date().getTime(); // Using timestamp for uniqueness
    const uniqueSlotId = `${floorTitle}-${slotIndex}-${uniqueElement}`;
    const uniqueDocName = `slot_${floorTitle}_${slotIndex}`; // Unique document name

    // Update the local state with new slot status
    const updatedSets = [...slotSets];
    const timestamp = new Date();

    const updatedUserDetails = {
      carPlateNumber,
      slotId: slotIndex,
      email: userDetails?.email || "",
      contactNumber: userDetails?.contactNumber || "",
      carPlateNumber: userDetails?.carPlateNumber || carPlateNumber,
      car: userDetails?.car || "",
      gender: userDetails?.gender || "",
      age: userDetails?.age || "",
      address: userDetails?.address || "",
      name: userDetails?.name || "",
      agent: fullName,
      floorTitle,
      timestamp,
    };

    updatedSets[currentSetIndex].slots[slotIndex] = {
      text: carPlateNumber,
      occupied: true,
      timestamp: timestamp,
      userDetails: updatedUserDetails,
    };

    setSlotSets(updatedSets);
    saveSlotsToLocalStorage(managementName, updatedSets);
    addToLogs(updatedUserDetails, slotIndex);


    const managementDocRef = doc(db, 'slot', managementName);
    const slotCollectionRef = collection(managementDocRef, 'slotData');
    const slotDocRef = doc(slotCollectionRef, uniqueDocName);
  
    const slotUpdate = { 
      status: 'Occupied', 
      slotId: uniqueSlotId, 
      userDetails: updatedUserDetails 
    };

     setDoc(slotDocRef, slotUpdate, { merge: true })
    .then(() => console.log(`Slot ${uniqueSlotId} status updated in Firebase under ${managementName}, floor ${floorTitle}`))
    .catch(error => console.error('Error updating slot status in Firebase:', error));
  
    setErrorMessage("");
};

const handleAcceptReservation = async (reservationId, slotId) => {
  // Ensure user context is available
  if (!user || !user.managementName) {
    console.error('User context with managementName is required.');
    return;
  }

  try {
    // Fetch the reservation details from Firebase
    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationSnapshot = await getDoc(reservationRef);
    if (!reservationSnapshot.exists()) {
      console.error('No such reservation!');
      return;
    }
    const reservationData = reservationSnapshot.data();

    // Extract timestamp from reservationData
    const reservationTimestamp = reservationData.timestamp;

    // Mark the slot as occupied in Firebase
    const slotDocRef = doc(db, 'slot', user.managementName, 'slotData', `slot_${slotId}`);
    await setDoc(slotDocRef, {
      status: 'Occupied',
      userDetails: {
        name: reservationData.userName,
        email: reservationData.userEmail,
        // Add additional details if necessary
      },
      timestamp: reservationTimestamp // Use the timestamp from reservationData
    }, { merge: true });

    // Update the local state to reflect the occupied slot
    setSlotSets((prevSlotSets) => {
      return prevSlotSets.map(slotSet => {
        return {
          ...slotSet,
          slots: slotSet.slots.map((slot, index) => {
            // Check if this is the slot that we are updating
            if (slot.id === slotId) {
              // Return a new object with the updated occupied status
              return { ...slot, occupied: true };
            }
            return slot; // Otherwise, return the slot as is
          }),
        };
      });
    });

    // Optionally save to local storage
    saveSlotsToLocalStorage(user.managementName, slotSets);

    console.log(`Reservation accepted for slot ID: ${slotId}`);

  } catch (error) {
    console.error('Error accepting reservation:', error);
  }
};

const renderFloorTabs = () => {
  // Function to get the continuous slot number
  const getContinuousSlotNumber = (floorIndex, slotIndex) => {
    let totalPreviousSlots = 0;
    for (let i = 0; i < floorIndex; i++) {
      totalPreviousSlots += slotSets[i].slots.length;
    }
    return totalPreviousSlots + slotIndex + 1;
  };
  
  return (
    <div style={{ marginTop: '20px' }}>
      <div className="notification-bell" onClick={() => { setShowNotification(!showNotification); setNotificationCount(0); }}>
        <FontAwesomeIcon icon={faBell} size="lg" />
        {notifications.length > 0 && !showNotification && (
          <span className="badge rounded-pill bg-danger">{notifications.length}</span>
        )}
</div>
{showNotification && (
  <div className="notification-panel show">
    {notifications.length > 0 ? renderNotifications() : <p>No new notifications.</p>}
  </div>
)}
      <Tab.Container activeKey={currentSetIndex} onSelect={k => setCurrentSetIndex(k)} id="floor-tabs">
        <Nav variant="tabs" className="flex-row" style={{ justifyContent: 'left', borderColor:'#132B4B' }}>
          {slotSets.map((slotSet, index) => (
            <Nav.Item key={index} style={{ width: '150px', textAlign: 'center' }}>
              <Nav.Link eventKey={index} style={{ borderRadius: '0.25rem', 
                 backgroundColor: currentSetIndex === index.toString() ? '#00171f' : 'transparent', 
                 color: currentSetIndex === index.toString() ? 'white' : 'black',
                 fontWeight: currentSetIndex === index.toString() ? 'bold' : 'normal',
                 border: currentSetIndex === index.toString() ? '1px solid #28a745' : 'none',
               }}>{slotSet.title}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        <Tab.Content>
          {slotSets.map((slotSet, index) => (
            <Tab.Pane eventKey={index} key={index}>
              <h2 style={{textAlign:'center', textTransform:'uppercase', fontWeight:'bold', fontSize:'36px', color:'#132B4B'}}>{slotSet.title} Floor </h2>
               <div className="flex-row" style={{display:'flex', justifyContent:'flex-end'}}>
                <Card style={{backgroundColor:'#e0fff6', boxShadow:'0 2px 4px #06bee1'}}>
                  <Card.Body>
                    <Card.Title style={{fontFamily:'Courier New', textAlign:'center'}}><FontAwesomeIcon icon={faFileInvoiceDollar} color="#011642"/> Parking Fee </Card.Title>
                    <Card.Text style={{ textAlign: 'center', fontFamily:'Copperplate', fontSize:'18px' }}>{parkingPay}.00</Card.Text>
                  </Card.Body>
                </Card>
              </div>  
              <div className='parkingContainer'>
                <div className='parkingGrid'>
                  {slotSet.slots.map((slot, slotIndex) => {
                    const continuousNumber = getContinuousSlotNumber(index, slotIndex);
                    return (
                      <div
                        key={slotIndex}
                        style={{
                          width: '95px',
                          height: '100px',
                          backgroundColor: slot.occupied ? 'red' : 'green',
                          color: 'white',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          margin: '5px',
                          borderRadius: '15px',
                          boxShadow: slot.occupied ? 
                          '0 2px 4px #DC143C' : 
                          '0 2px 4px #00ff00', 
                       }}
                        onClick={() => handleSlotClick(slotIndex)}
                      >
                        {slot.occupied ? (
                          <div>
                            <div>{slot.userDetails ? slot.userDetails.carPlateNumber : continuousNumber} </div>
                          </div>
                        ) : (
                          continuousNumber
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};
  
  const handleSlotClick = (index) => {
    setSelectedSlot(index);
    setShowModal(true);
    setUserDetails(slotSets[currentSetIndex].slots[index]?.userDetails || null);
  };
  
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const handleExitSlot = async (slotIndex) => {
  // Check if the slot is already empty
  if (!slotSets[currentSetIndex].slots[slotIndex].occupied) {
    setErrorMessage("This slot is already empty.");
    return;
  }

  // Assuming managementName is available in your component
  const managementDocRef = doc(db, 'slot', managementName);
  const slotCollectionRef = collection(managementDocRef, 'slotData');
  const floorTitle = slotSets[currentSetIndex].title || "General Parking";
  const slotDocRef = doc(slotCollectionRef, `slot_${floorTitle}_${slotIndex}`);
  const userDetails = slotSets[currentSetIndex].slots[slotIndex].userDetails;

  console.log("User Details at exit:", userDetails);

  if (!userDetails.email) {
    const userRef = collection(db, 'user');
    const q = query(userRef, where('email', '==',userDetails.userEmail));
    const userSnap = await getDocs(q);
    if (!userSnap.empty) {
      userDetails.email = userSnap.docs[0].data().email;
    } else {
      console.error('User not found in users collection');
      return;
    }
  }
  try {
    await deleteDoc(slotDocRef);
    console.log(`Slot ${slotIndex} data deleted from Firebase under ${managementName}`);
    if (userDetails) {
      await sendExitNotification(userDetails, floorTitle, slotIndex);
    }
  } catch (error) {
    console.error('Error deleting slot data from Firebase:', error);
    setErrorMessage('Error processing slot exit. Please try again.');
  }

  updateSets(slotIndex);
};

const sendExitNotification = async (userDetails, floorTitle, slotIndex) => {
  const userTokenDocRef = doc(db, "userTokens", userDetails.email);
  const docSnap = await getDoc(userTokenDocRef);

  if (docSnap.exists()) {
    const { token } = docSnap.data();
    const notificationData = {
      appId: 24190, 
      appToken: '7xmUkgEHBQtdSvSHDbZ9zd', 
      title: 'Parking Slot Exited',
      message: `You have exited your parking slot on ${floorTitle} floor at slot number ${slotIndex + 1}. Thank you for visiting!`,
      targetUsers: [token], 
      subID: userDetails.email 
    };

    console.log("Sending exit notification with data:", JSON.stringify(notificationData));
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
      console.log('Exit notification sent successfully:', text);
    })
    .catch(error => {
      console.error('Error sending exit notification:', error);
    });
  } else {
    console.error("No device token found for userEmail:", userDetails.email);
  }
};

const updateSets = (slotIndex) => {
  // Update local state to reflect the slot is now empty
  const updatedSets = slotSets.map((set, idx) => {
    if (idx === currentSetIndex) {
      return {
        ...set,
        slots: set.slots.map((slot, i) => {
          if (i === slotIndex) {
            return {
              ...slot,
              occupied: false,
              userDetails: null
            };
          }
          return slot;
        })
      };
    }
    return set;
  });
  setSlotSets(updatedSets);

  // Update the count of available spaces
  setZoneAvailableSpaces((prevSpaces) => {
    const updatedSpaces = [...prevSpaces];
    updatedSpaces[currentSetIndex]++;
    return updatedSpaces;
  });

  // Clear any error message and close the confirmation dialog if it's open
  setErrorMessage('');
  setShowExitConfirmation(true);
};
  
  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
  };
  

  const handleCancelExit = () => {
    setShowExitConfirmation(false); 
  };
  const handleCloseModal = () => {
    setShowModal(false);        // Hide the modal
    setShowButtons(false);      // Hide the buttons
    setShowConfirmation(false); // Hide the confirmation message
    setErrorMessage('');        // Clear any error messages
    setUserDetails({});         // Reset user details if necessary
};

const toggleSidebar = () => {
  setShowSidebar(!showSidebar);
};

const renderNotifications = () => {
  return (
    <table className="notification-table">
      <thead>
        <tr>
        <th style={{color: 'green'}}>Notifications</th>
        </tr>
      </thead>
     <tbody>
        {notifications.map((notification, index) => (
         <tr key={index} onClick={() => handleNotificationClick(notification)}>
           <td style={{color: 'black'}}>{notification.details} by {notification.userEmail}</td>
         </tr>
        ))}
      </tbody>
    </table>
  );
};

  return (
    <div className="d-flex" >
                 <div>
                 <div className="admin-dashboard">
                    <div className="sidebar">
                        <div className="admin-container">
                            <img 
                                src="customer.jpg"
                                alt="Admin"
                                className="admin-pic" 
                                style={{ width: '30px', marginRight: '5px', marginLeft: '-50px' }} 
                            />
                            {/* Display the user's email if available */}
                            <h1 style={{fontFamily:'Helvetica', fontSize: 16}}>Welcome {user?.firstName || 'No name found'}</h1>
                        </div>
                        <div class="wrapper">
            <div class="side">
            <h2>Menu</h2>
            <ul>
            <li><a href="Home"><i class="fas fa-home"></i>Home</a></li>
              <li><a href="ViewSpace"><i class="fas fa-home"></i>Manage Parking</a></li>
              <li><a href='Reservation'><i class="fas fa-user"></i>Manage Reservation</a></li>
              <li><a href='OperatorDashboard'><i class="fas fa-address-card"></i>Records</a></li>
              <li><a href="OperatorProfile"><i class="fas fa-blog"></i>Profile</a></li>
              <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
          {slotSets.length > 0 ? renderFloorTabs() : <p>Loading floors...</p>}
        </div>
      
        <Modal show={showModal} onHide={handleCloseModal}>
    <Modal.Header closeButton >
        <Modal.Title >Parking Slot {selectedSlot + 1}</Modal.Title>
    </Modal.Header>
    <Modal.Body style={{backgroundColor: '#fff8c9' }}>
        {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
        {selectedSlot !== null && (
            <SearchForm
                onSearch={searchInFirebase}
                onSelectSlot={(carPlateNumber) => handleAddToSlot(carPlateNumber, selectedSlot)}
                onExitSlot={() => handleExitSlot(selectedSlot)}
                selectedSlot={selectedSlot}
                userDetails={userDetails}
            />
        )}
         <hr className="divider" />
        {selectedSlot !== null && userDetails && (
            <div className="user-details">
                <h4 style={{fontFamily:'Copperplate', fontWeight:'bold'}}>User Details:</h4>
              <div class="details-row">
                  <span class="label">Email:</span>
                  <span class="value">{userDetails.email}</span>
              </div>
              <div class="details-row">
                  <span class="label">Contact Number:</span>
                  <span class="value">{userDetails.contactNumber}</span>
              </div>
              <div class="details-row">
                  <span class="label">Car Plate Number:</span>
                  <span class="value">{userDetails.carPlateNumber}</span>
              </div>
              <div class="details-row">
                  <span class="label">Gender:</span>
                  <span class="value">{userDetails.gender}</span>
              </div>
              <div class="details-row">
                  <span class="label">Age:</span>
                  <span class="value">{userDetails.age}</span>
              </div>
              <div class="details-row">
                  <span class="label">Address:</span>
                  <span class="value">{userDetails.address}</span>
              </div>
              {slotSets[currentSetIndex].slots[selectedSlot].timestamp && (
                  <div class="details-row">
                      <span class="label">Timestamp:</span>
                      <span class="value">{slotSets[currentSetIndex].slots[selectedSlot].timestamp.toString()}</span>
                  </div>
              )}
          </div>
          )}
            {showButtons && (
            <div>
                <button className='btn-custom-assign' onClick={() => {
                    if (!userFound) {
                        setShowConfirmation(true); 
                    } else {
                        handleAddToSlot(userPlateNumber, selectedSlot);
                    }
                }}>
                    Assign
                </button>
                <button className= 'btn-custom-exit'  onClick={() => handleExitSlot(selectedSlot)}>
                    Exit
                </button>
            </div>
        )}
        {showConfirmation && (
            <div>
                <p style={{marginTop: '10px', fontFamily:'Copperplate'}}>No record found. Do you want to proceed?</p>
                <button className='btn-custom-no' onClick={() => setShowConfirmation(false)}>
                    No
                </button>
                <button className='btn-custom-yes' onClick={() => {
                    handleAddToSlot(userPlateNumber, selectedSlot);
                    setShowConfirmation(false);
                }}>
                    Yes
                </button>
            </div>
        )}
    </Modal.Body>
    <Modal.Footer>
        {recordFound ? null : <div style={{ color: 'red' }}>No record found for this car plate number.</div>}
    </Modal.Footer>
  </Modal>
      <Modal show={showExitConfirmation} onHide={handleCancelExit}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to vacant this slot?</Modal.Body>
        <Modal.Footer>
          <button className='btn-custom-no' onClick={handleCancelExit}>
            No
          </button>
          <button className='btn-custom-yes' onClick={handleConfirmExit}>
            Yes
          </button>
        </Modal.Footer>
      </Modal>
    </div>
    </div>
    </div>
 
  );
};


export default ParkingSlot;