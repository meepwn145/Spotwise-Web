import React, { useState, useEffect, useContext, useMemo} from 'react';
import { Button, Modal, Form, Tab, Nav} from 'react-bootstrap';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Link, } from 'react-router-dom';
import { FaUserCircle } from "react-icons/fa";
import { db } from "../config/firebase";
import { collection, getDocs, query, where, serverTimestamp,addDoc, setDoc, doc, getDoc, onSnapshot, deleteDoc} from 'firebase/firestore';
import SearchForm from './SearchForm';
import UserContext from '../UserContext';
import { useNavigate } from 'react-router-dom';
import './DashboardOp.css';
import './space.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import Card from 'react-bootstrap/Card';

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

  const [slotSets, setSlotSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    // First, attempt to load from local storage to show previous data quickly
    const savedSlots = loadSlotsFromLocalStorage(user.managementName);
    if (savedSlots.length > 0) {
      setSlotSets(savedSlots);
      console.log('Loaded slots from local storage:', savedSlots);
    }

    // Prepare to fetch occupied slots information
    const parkingLogsRef = collection(db, 'logs', managementName, 'floors' );
    const parkingLogsQuery = query(parkingLogsRef, where('managementName', '==', user.managementName), where('timeOut', '==', null));
  
    let occupiedSlots = new Map();
    const unsubLogs = onSnapshot(parkingLogsQuery, (snapshot) => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const slotKey = `${data.floorTitle}-${data.slotId}`;
        console.log(`Fetched: ${slotKey} with plate: ${data.carPlateNumber}`);  // Check what you fetch
        occupiedSlots.set(slotKey, data);
      });
      console.log("All occupied slots", Array.from(occupiedSlots.entries()));  // To see all fetched data
  

      // Now fetch establishment data
      const collectionRef = collection(db, 'establishments');
      const q = query(collectionRef, where('managementName', '==', user.managementName));
      
      const unsubEstablishments = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const establishmentData = snapshot.docs[0].data();
          let newSlotSets = [];

          if (Array.isArray(establishmentData.floorDetails) && establishmentData.floorDetails.length > 0) {
            newSlotSets = establishmentData.floorDetails.map(floor => ({
              title: floor.floorName,
              slots: Array.from({ length: parseInt(floor.parkingLots) }, (_, i) => {
                const slotKey = `${floor.floorName}-${i}`; 
                const slotData = occupiedSlots.get(slotKey);
                return {
                  id: i,
                  occupied: !!slotData,
                  userDetails: slotData ? { carPlateNumber: slotData.carPlateNumber || 'N/A' } : null
                };
              }),
            }));
          } else if (establishmentData.totalSlots) {
            newSlotSets = [{
              title: 'General Parking',
              slots: Array.from({ length: parseInt(establishmentData.totalSlots) }, (_, i) => ({
                id: i,
                occupied: occupiedSlots.has(i)
              })),
            }];
          }

          console.log('New Slot Sets:', newSlotSets);

          // Update the slot sets with potentially new data
          setSlotSets(newSlotSets);
          saveSlotsToLocalStorage(user.managementName, newSlotSets);
        } else {
          console.log('No such establishment!');
        }
      });
    });
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
    } catch (error) {
      console.error('Error:', error);
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
               <div className="flex-row" style={{display:'flex', justifyContent:'flex-end'}}>
                <Card style={{backgroundColor:'#e0fff6', boxShadow:'0 2px 4px #06bee1'}}>
                  <Card.Body>
                    <Card.Title style={{fontFamily:'Courier New', textAlign:'center'}}><FontAwesomeIcon icon={faFileInvoiceDollar} color="#011642"/> Parking Fee </Card.Title>
                    <Card.Text style={{ textAlign: 'center', fontFamily:'Copperplate', fontSize:'18px' }}>{parkingPay}</Card.Text>
                  </Card.Body>
                </Card>
              </div>  
              <h2 style={{textAlign:'center', marginTop:'10vh', textTransform:'uppercase', fontWeight:'bold', fontSize:'36px', color:'#132B4B'}}>{slotSet.title} Floor </h2>
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
    const slotDocRef = doc(slotCollectionRef, `slot_${slotIndex}`);
  
    try {
      // Delete the slot document from Firestore
      await deleteDoc(slotDocRef);
      console.log(`Slot ${slotIndex} data deleted from Firebase under ${managementName}`);
    } catch (error) {
      console.error('Error deleting slot data from Firebase:', error);
      setErrorMessage('Error processing slot exit. Please try again.');
      return;
    }
  
    // Update local state to reflect the slot is now empty
    const updatedSets = [...slotSets];
    updatedSets[currentSetIndex].slots[slotIndex] = {
      text: slotIndex + 1, 
      occupied: false,
      timestamp: null,
      userDetails: null,
    };
    setSlotSets(updatedSets);
  
    // Update the count of available spaces
    setZoneAvailableSpaces((prevSpaces) => {
      const updatedSpaces = [...prevSpaces];
      updatedSpaces[currentSetIndex]++;
      return updatedSpaces;
    });
  
    // If there are userDetails, log the exit
    const userDetails = updatedSets[currentSetIndex].slots[slotIndex].userDetails;
    if (userDetails && userDetails.carPlateNumber) {
      const logData = {
        carPlateNumber: userDetails.carPlateNumber,
        timeOut: new Date(),
        paymentStatus: 'Paid',
      };
  
      try {
        const logsCollectionRef = collection(db, 'logs', managementName, 'floors' );
        const q = query(logsCollectionRef, where('carPlateNumber', '==', userDetails.carPlateNumber));
        const querySnapshot = await getDocs(q);
  
        querySnapshot.forEach(async (doc) => {
          const docRef = doc.ref;
          await setDoc(docRef, logData, { merge: true });
        });
      } catch (error) {
        console.error('Error updating logs: ', error);
      }
    }
  
    // Clear any error message and close the confirmation dialog if it's open
    setErrorMessage('');
    setShowExitConfirmation(false);
  };
  
  
  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
  };
  const handleCancelExit = () => {
    setShowExitConfirmation(false); 
  };
  

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <div className="sidebar" style={{ width: '250px', backgroundColor: '#003851' }}>
        <div className="sidebar-header" style={{ padding: '20px', color: 'white', textAlign: 'center', fontSize: '24px' }}>
          <FaUserCircle size={28} style={{ marginRight: '10px' }} /> Welcome,  {user?.firstName || 'No name found'}
        </div>
        <div class="wrapper">
          <div class="side">
            <h2>Menu</h2>
            <ul>
              <li><a href="ViewSpace"><i class="fas fa-home"></i>Home</a></li>
              <li><a href='Reservation'><i class="fas fa-user"></i>Manage Reservation</a></li>
              <li><a href='OperatorDashboard'><i class="fas fa-address-card"></i>Report</a></li>
              <li><a href="OperatorProfile"><i class="fas fa-blog"></i>Profile</a></li>
              <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
          {slotSets.length > 0 ? renderFloorTabs() : <p>Loading floors...</p>}
        </div>
      
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Parking Slot {selectedSlot + 1}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
          {selectedSlot !== null && userDetails !== null && (
              <div class="user-details">
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
          <Button variant="secondary" onClick={handleCancelExit}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirmExit}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};


export default ParkingSlot;