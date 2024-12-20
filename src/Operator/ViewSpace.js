import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button, Modal, Form, Tab, Nav } from "react-bootstrap";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaUserCircle, FaBars, FaBell } from "react-icons/fa";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  addDoc,
  setDoc,
  doc,
  getDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import SearchForm from "./SearchForm";
import UserContext from "../UserContext";
import { useNavigate } from "react-router-dom";
import { faB, faBell } from "@fortawesome/free-solid-svg-icons";
import "./DashboardOp.css";
import "./space.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import Card from "react-bootstrap/Card";
import { ToastContainer, toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

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
  const [highlightedSlot, setHighlightedSlot] = useState(null);
const [highlightedFloorIndex, setHighlightedFloorIndex] = useState(null);
  const { user } = useContext(UserContext);
  const maxZones = 5;
  const initialSlotSets = [{ title: "Zone 1", slots: Array(15).fill(false) }];
  const [parkingPay, setParkingPay] = useState(0);
  const initialTotalSpaces = initialSlotSets
    .map((zone) => zone.slots.length)
    .reduce((total, spaces) => total + spaces, 0);
  const [showButtons, setShowButtons] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [slotSets, setSlotSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const location = useLocation(); // Get the current route path
  const [showAssignButton, setShowAssignButton] = useState(false);
const [showExitButton, setShowExitButton] = useState(false);
const [enterPressed, setEnterPressed] = useState(false);
  const totalParkingSpaces = slotSets.reduce(
    (total, slotSet) => total + slotSet.slots.length,
    0
  );
  const availableParkingSpaces = slotSets.reduce((available, slotSet) => {
    return available + slotSet.slots.filter((slot) => !slot.occupied).length;
  }, 0);

  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [uploadedByEmail, setUploadedByEmail] = useState("");
  const saveSlotsToLocalStorage = (managementName, slots) => {
    try {
      localStorage.setItem(`slotSets_${managementName}`, JSON.stringify(slots));
      console.log("Saved slots to local storage for:", managementName);
    } catch (error) {
      console.error("Error saving slots to local storage:", error);
    }
  };
  const [processedReservations, setProcessedReservations] = useState(new Set());
  // useEffect(() => {
  //   const fetchSlotData = async () => {
  //     const fetchedSlotData = new Map();
  //     const slotDataQuery = query(collection(db, "slot", user.managementName, "slotData"));
  //     const slotDataSnapshot = await getDocs(slotDataQuery);
  //     slotDataSnapshot.forEach((doc) => {
  //       fetchedSlotData.set(doc.id, {
  //         ...doc.data(),
  //         occupied: doc.data().status === "Occupied",
  //         from: doc.data().from || 'Not Specified',
  //       });
  //     });
  
  //     setSlotSets((currentSlotSets) =>
  //       currentSlotSets.map((slotSet) => ({
  //         ...slotSet,
  //         slots: slotSet.slots.map((slot, index) => {
  //           const slotId = `slot_${slotSet.title}_${index}`;
  //           const slotData = fetchedSlotData.get(slotId);
  //           return {
  //             ...slot,
  //             occupied: slotData ? slotData.occupied : false,
  //             from: slotData ? slotData.from : "Not Specified",
  //             userDetails: slotData ? slotData.userDetails : undefined,
  //           };
  //         }),
  //       }))
  //     );
  //   };
  
  //   if (user?.managementName) {
  //     fetchSlotData();
  //   }
  // }, [user?.managementName]);
  
  
  
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, "reservations"),
      where("status", "==", "Paid"),
      where("managementName", "==", user.managementName)
    ),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const reservationData = change.doc.data();
          const reservationId = change.doc.id;

          // Check if this reservation has already been processed
          if (processedReservations.has(reservationId)) {
            return;
          }

          const now = new Date();
          const lastNotified = reservationData.lastNotified
            ? new Date(reservationData.lastNotified.seconds * 1000)
            : null;

          if (
            reservationData.imageUri &&
            reservationData.imageUri !== "" &&
            (!lastNotified || now - lastNotified > 60000) // 1 minute interval
          ) {
            setUploadedByEmail(reservationData.userEmail);
            setShowImageUploadModal(true);

            // Update the `lastNotified` field in Firestore
            setDoc(
              doc(db, "reservations", reservationId),
              {
                lastNotified: serverTimestamp(),
              },
              { merge: true }
            );

            // Add the reservation to the processed set
            setProcessedReservations((prevProcessed) => {
              const newProcessed = new Set(prevProcessed);
              newProcessed.add(reservationId);
              return newProcessed;
            });
          }
        }
      });
    }
  );

  return () => unsubscribe();
}, [user?.managementName, processedReservations]);

const [showNewReservationModal, setShowNewReservationModal] = useState(false);
const [newReservationDetails, setNewReservationDetails] = useState({});
const [gracePeriod, setGracePeriod] = useState("");
const [continuousParkingFee, setContinuousParkingFee] = useState("");
const [hourType, setHourType] = useState("");
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, "reservations"),
      where("status", "==", "Approval"), // Only listen for reservations with status "Approval"
      where("managementName", "==", user.managementName)
    ),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const reservationData = change.doc.data();

          // Display the new reservation modal if the status is "Approval"
          if (reservationData.status === "Approval") {
            setNewReservationDetails(reservationData);
            setShowNewReservationModal(true);
          }
        }
      });
    }
  );

  return () => unsubscribe();
}, [user?.managementName]);

 const handleCloseNewReservationModal = () => {
   setShowNewReservationModal(false);
   navigate("/Reservation"); // Navigate to the Reservation page if desired
 };


   const handleCloseImageUploadModal = () => {
     setShowImageUploadModal(false);
     setUploadedByEmail(""); 
   };
  

  const loadSlotsFromLocalStorage = (managementName) => {
    try {
      const savedSlots = localStorage.getItem(`slotSets_${managementName}`);
      return savedSlots ? JSON.parse(savedSlots) : [];
    } catch (error) {
      console.error("Error loading slots from local storage:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchEstablishmentData = async () => {
      try {
        const q = query(
          collection(db, "establishments"),
          where("managementName", "==", user.managementName)
        );
        const querySnapshot = await getDocs(q);

        console.log(`Found ${querySnapshot.docs.length} documents`);
        if (!querySnapshot.empty) {
          const establishmentData = querySnapshot.docs[0].data();
          console.log("Establishment Data:", establishmentData);
  
          setParkingPay(establishmentData.parkingPay);
          if (establishmentData.hourType === "Continuous") {
            setGracePeriod(establishmentData.gracePeriod);
            setContinuousParkingFee(establishmentData.continuousParkingFee);
          } else {
            setGracePeriod(null);
            setContinuousParkingFee(null);
          }
        } else {
          console.log("No matching establishment found!");
        }
      } catch (error) {
        console.error("Error fetching establishment data:", error);
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
        collection(db, "notifications"),
        where("managementName", "==", user.managementName)
      ),
      (snapshot) => {
        const fetchedNotifications = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            fetchedNotifications.push({
              ...change.doc.data(),
              id: change.doc.id,
            });
          }
          if (change.type === "removed") {
            setNotifications(
              notifications.filter((n) => n.id !== change.doc.id)
            );
          }
        });
        setNotifications(fetchedNotifications);
        setNotificationCount(fetchedNotifications.length);
      }
    );

    return () => unsubscribe();
  }, [user?.managementName]);
  const handleNotificationClick = () => {
    console.log("Notification bell clicked, current state of showNotification:", showNotification);
    
    // Toggle the visibility of the notification panel
    setShowNotification(prevShowNotification => {
        if (!prevShowNotification) {
            // Only reset the notification count if the notification panel is currently hidden and will be shown
            console.log("Setting notification count to 0");
            setNotificationCount(0);
        }
        return !prevShowNotification;
    });
};


  useEffect(() => {
    let fetchedSlotData = new Map();
    // Fetch slot data
    const fetchSlotData = async () => {
      const slotDataQuery = query(collection(db, "slot", user.managementName, "slotData"));
      const slotDataSnapshot = await getDocs(slotDataQuery);
      let fetchedSlotData = new Map(); 
      console.log("Fetched Slot Data:", fetchedSlotData);
      console.log("Slot Data Snapshot:", slotDataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); // Log the entire snapshot for verification
      slotDataSnapshot.forEach((doc) => {
        fetchedSlotData.set(doc.id, {
          ...doc.data(),
          occupied: doc.data().status === "Occupied",
          from: doc.data().from || 'Not Specified',
          allocatedTimeForArrival: doc.data().allocatedTimeForArrival || "default_value",
        });
      });
    };
        

    const updateSlots = () => {
      setSlotSets((currentSlotSets) =>
        currentSlotSets.map((slotSet) => {
          const floorOrZone = slotSet.title.replace(/\s+/g, "_");
          return {
            ...slotSet,
            slots: slotSet.slots.map((slot, index) => {
              const slotId1 = `slot_${slotSet.title}_${index}`;
              const slotId =
                floorOrZone === "General_Parking"
                  ? `General Parking_${index + 1}`
                  : `${floorOrZone}_${slot.slotNumber || index + 3}`;
              const slotData = fetchedSlotData.get(slotId1);
              const isOccupied = slotData && slotData.occupied;
              return {
                ...slot,
                occupied: isOccupied,
                userDetails: isOccupied,
                from: slotData ? slotData.from : "Not Specified"
                  ? {
                      // Show carPlateNumber from resData if available, otherwise from slotData
                      carPlateNumber: slotData?.userDetails?.carPlateNumber,
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
        console.log("Loaded slots from local storage:", savedSlots);
        setSlotSets(savedSlots);
      }
      fetchData(managementName); // Always fetch to ensure you have the latest data.
    }
  }, [user?.managementName]);

  const savedSlots = useMemo(() => loadSlotsFromLocalStorage(), []);

  const fetchData = async (managementName) => {
    if (!user || !user.managementName) {
      console.log("No user logged in or management name is missing");
      return;
    }

    setIsLoading(true);

    try {
      const slotDocRef = doc(db, "slot", managementName);
      const slotCollectionRef = collection(slotDocRef, "slotData");
      const slotsSnapshot = await getDocs(slotCollectionRef);
      const occupiedSlots = new Map();
      slotsSnapshot.forEach((doc) => {
        const data = doc.data();
        occupiedSlots.set(doc.id, data);
      });

      const establishmentRef = collection(db, "establishments");
      const q = query(
        establishmentRef,
        where("managementName", "==", managementName)
      );
      const establishmentSnapshot = await getDocs(q);

      if (!establishmentSnapshot.empty) {
        const establishmentData = establishmentSnapshot.docs[0].data();
        let newSlotSets = [];

        // Check if floorDetails exist and handle them accordingly
        if (
          establishmentData.floorDetails &&
          establishmentData.floorDetails.length > 0
        ) {
          // Floor details provided as an array
          newSlotSets = establishmentData.floorDetails.map((floor) => ({
            title: floor.floorName,
            slots: Array.from(
              { length: parseInt(floor.parkingLots) },
              (_, i) => {
                const slotKey = `slot_${floor.floorName}_${i}`;
                const slotData = occupiedSlots.get(slotKey);
                return {
                  id: i,
                  occupied: !!slotData,
                  userDetails: slotData ? slotData.userDetails : null,
                  from: slotData ? slotData.from : "Not Specified",
                };
              }
            ),
          }));
        } else if (establishmentData.totalSlots) {
          // Only totalSlots provided, create a single generic floor
          newSlotSets = [
            {
              title: "General Parking",
              slots: Array.from(
                { length: parseInt(establishmentData.totalSlots) },
                (_, i) => {
                  const slotKey = `slot_General Parking_${i}`;
                  const slotData = occupiedSlots.get(slotKey);
                  return {
                    id: i,
                    occupied: !!slotData,
                    userDetails: slotData ? slotData.userDetails : null,
                    from: slotData ? slotData.from : "Not Specified"
                  };
                }
              ),
            },
          ];
        }

        setSlotSets(newSlotSets);
        saveSlotsToLocalStorage(managementName, newSlotSets);
      } else {
        console.log("No such establishment found!");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
    initialSlotSets.map((zone) => zone.slots.length)
  );
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const managementName = user?.managementName;
    if (managementName) {
      fetchSlots(managementName);
    }
  }, [user?.managementName]);

  const fetchSlots = async (managementName) => {
    const collectionRef = collection(db, "establishments");
    const q = query(
      collectionRef,
      where("managementName", "==", managementName)
    );

    onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const establishmentData = snapshot.docs.map((doc) => doc.data())[0];
          let newSlotSets = [];

          if (Array.isArray(establishmentData.floorDetails)) {
            newSlotSets = establishmentData.floorDetails.map((floor) => ({
              title: floor.floorName,
              slots: Array.from({ length: floor.parkingLots }, (_, i) => ({
                id: i,
                occupied: false,
              })),
            }));
          }

          setSlotSets(newSlotSets);
        } else {
          console.log("No such establishment!");
        }
      },
      (error) => {
        console.error("Error fetching establishment data:", error);
      }
    );
  };

  const handleTabSelect = (key) => {
    console.log("Tab selected:", key);
    const newIndex = parseInt(key, 10);
    setCurrentSetIndex(newIndex);
  
    if (slotSets[newIndex] && (selectedSlot >= slotSets[newIndex].slots.length)) {
      setSelectedSlot(null);
    }
  };
  
  

  const [recordFound, setRecordFound] = useState(true);
  const [userFound, setUserFound] = useState(true);
  const searchInFirebase = async (searchInput) => {
    try {
      const collectionRef = collection(db, "user");
      const q = query(collectionRef, where("carPlateNumber", "==", searchInput));
      const querySnapshot = await getDocs(q);
      const user = querySnapshot.docs.find(doc => doc.data().carPlateNumber === searchInput);
  
      const { found, floorIndex, slotIndex } = findPlateAcrossFloors(searchInput);
      setUserPlateNumber(searchInput);  // Set the plate number regardless of finding the user
      if (user) {
        console.log("Found user:", user.data());
        setUserDetails(user.data());
        setUserFound(true);
  
        if (found) {
          setCurrentSetIndex(floorIndex);
          setSelectedSlot(slotIndex);
          console.log(`Car is already assigned at floor ${floorIndex}, Slot Number ${slotIndex + 1}`);
        } else {
          console.log("Car is registered but currently not parked.");
        }
      } else {
        console.log("User not found. Car is not registered and currently not parked.");
        setUserDetails({});
        setUserFound(false);
      }
      setShowButtons(true);
    } catch (error) {
      console.error("Error:", error);
      setShowButtons(false);
    }
  };
  


  const [userDetailsSecond, setUserDetailsSecond] = useState({});
const [userPlateNumberSecond, setUserPlateNumberSecond] = useState("");
const [currentSetIndexSecond, setCurrentSetIndexSecond] = useState(0);
const [selectedSlotSecond, setSelectedSlotSecond] = useState(null);
const [showButtonsSecond, setShowButtonsSecond] = useState(false);
const [userFoundSecond, setUserFoundSecond] = useState(false);
useEffect(() => {
  if (currentSetIndexSecond !== null) {
    setCurrentSetIndex(currentSetIndexSecond);
  }
}, [currentSetIndexSecond]);

const searchInFirebaseSecondInput = async (searchInput, showAlert = true) => {
  try {
    const collectionRef = collection(db, "user");
    const q = query(
      collectionRef,
      where("carPlateNumber", "==", searchInput)
    );
    const querySnapshot = await getDocs(q);
    const user = querySnapshot.docs.find(
      (doc) => doc.data().carPlateNumber === searchInput
    );

    const { found, floorIndex, slotIndex } = findPlateAcrossFloors(searchInput);
    if (user) {
      console.log("Found user:", user.data());
      setUserPlateNumberSecond(user.data().carPlateNumber || searchInput);
      setUserDetailsSecond(user.data());
      setUserFoundSecond(true);

      if (found && showAlert) {
        setCurrentSetIndexSecond(floorIndex); // Different variable for index
        setSelectedSlotSecond(slotIndex); // Different variable for slot
        setHighlightedFloorIndex(floorIndex); // Ensure highlighting is set
        setHighlightedSlot(slotIndex);
        const floorName = slotSets[floorIndex].title;
        alert(`Car found at ${floorName}, Slot Number ${slotIndex + 1}`);
      } else {
        alert("Car is registered but currently not parked.");
      }
    } else {
      console.log("User not found.");
      setUserDetailsSecond({ carPlateNumber: searchInput });
      setUserPlateNumberSecond(searchInput);
      setUserFoundSecond(false);
      if (found && showAlert) {
        setCurrentSetIndexSecond(floorIndex);
        setSelectedSlotSecond(slotIndex);
        setHighlightedFloorIndex(floorIndex);
        setHighlightedSlot(slotIndex);
        const floorName = slotSets[floorIndex].title;
        alert(`Car is not registered but found on ${floorName}, Slot Number ${slotIndex + 1}`);
      } else if (showAlert) {
        alert("Car is not registered and currently not parked.");
      }
    }
    setShowButtonsSecond(true); // Show Assign and Exit buttons regardless of search outcome
  } catch (error) {
    console.error("Error:", error);
    setShowButtonsSecond(false);
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
  const [agent, setAgentName] = useState(user.firstName || "");
  const [agentL, setAgentLName] = useState(user.lastName || "");
  const [managementName, setManagementName] = useState(
    user.managementName || ""
  );
  const fullName = `${agent} ${agentL}`;
  const [errorMessage, setErrorMessage] = useState("");

  const addToLogs = async (userDetails, slotNumber) => {
    try {
      const logsCollectionRef = collection(
        db,
        "logs",
        managementName,
        "floors"
      );
      const timestamp = new Date();
      const logData = {
        ...userDetails,
        status: "Occupied", // Add status to log data
        timeIn: timestamp,
        timeOut: null,
        agent: fullName,
        managementName: managementName,
      };

      const docRef = await addDoc(logsCollectionRef, logData);
      console.log("Log added with ID: ", docRef.id);
    } catch (error) {
      console.error("Error adding log: ", error);
    }
  };

  const [userDetails, setUserDetails] = useState({});
  const [userPlateNumber, setUserPlateNumber] = useState("");
  // const [first, setfirst] = useState(second)

  const handleOnChange = (input) => {
    setUserPlateNumber(input);
  };

  const getContinuousSlotNumber = (floorIndex, slotIndex) => {
    let totalPreviousSlots = 0;
    for (let i = 0; i < floorIndex; i++) {
      totalPreviousSlots += slotSets[i].slots.length;
    }
    return totalPreviousSlots + slotIndex + 1;
  };
  const handleAddToSlot = (carPlateNumber, slotIndex) => {
    const slot = slotSets[currentSetIndex].slots[slotIndex];
      const walkIn = "Walk-in";
    if (slot.occupied ) {
      setErrorMessage("Cannot assign user is already parked.");
      return;
    }
    if (!carPlateNumber || carPlateNumber.trim() === "") {
      setErrorMessage("Please enter a plate number.");
      return;
    }
    if (!userFound) {
      const confirmAssign = window.confirm(
        "No record found. Do you want to proceed?"
      );
      if (!confirmAssign) {
        return;
      }
    }

    const existingSlotIndex = findPlateNumber(carPlateNumber);
    if (existingSlotIndex !== -1 && existingSlotIndex !== slotIndex) {
      setErrorMessage(
        `Car plate number already assigned to slot ${
          existingSlotIndex + 1
        } on this floor.`
      );
      return;
    }

    const slotData = findPlateAcrossFloors(carPlateNumber);
    if (slotData.found && slotData.floorIndex !== currentSetIndex) {
      const floorName = slotSets[slotData.floorIndex].title;
      setErrorMessage(
        `Car plate number already assigned to floor "${floorName}" in slot ${
          slotData.slotIndex + 1
        }.`
      );
      return;
    }
    const continuousSlotNumber = getContinuousSlotNumber(currentSetIndex, slotIndex);
    const floorTitle = slotSets[currentSetIndex].title || "General Parking";
    const uniqueElement = new Date().getTime(); // Using timestamp for uniqueness
    const uniqueSlotId = `${floorTitle}-${slotIndex}-${uniqueElement}`;
    const uniqueDocName = `slot_${floorTitle}_${slotIndex}`; // Unique document name
    // Update the local state with new slot status
    const updatedSets = [...slotSets];
    const timestamp = new Date();

    if (user.hourType === "Continuous") {
      updatedUserDetails.gracePeriod = gracePeriod;  // Assumes gracePeriod is defined in your state
      updatedUserDetails.continuousParkingFee = continuousParkingFee;  // Assumes continuousParkingFee is defined in your state
  }

    const updatedUserDetails = {
      carPlateNumber,
      slotId: slotIndex,
      userEmail: userDetails?.email || "",
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
      slotNumber: continuousSlotNumber,
      from: walkIn,
      gracePeriod: gracePeriod,
      continuousParkingFee: continuousParkingFee,
      parkingPay: parkingPay,
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

    console.log(`managementName: ${managementName}, floorTitle: ${floorTitle}`);
    const managementDocRef = doc(db, "slot", managementName);
    const slotCollectionRef = collection(managementDocRef, "slotData");
    const slotDocRef = doc(slotCollectionRef, uniqueDocName);

    const slotUpdate = {
      status: "Occupied",
      slotId: uniqueSlotId,
      userDetails: updatedUserDetails,
      slotNumber: continuousSlotNumber, 
      from: walkIn,
    };

    setDoc(slotDocRef, slotUpdate, { merge: true })
      .then(() => {
        console.log(
          `Slot ${uniqueSlotId} status updated in Firebase under ${managementName}, floor ${floorTitle}`
          
        );
        if (updatedUserDetails.userEmail) {
          sendEntryNotification(updatedUserDetails, floorTitle, slotIndex);
        } else {
          console.log("No userEmail provided, cannot send entry notification.");
        }
      })
      .catch((error) =>
        console.error("Error updating slot status in Firebase:", error)
      );

      const checkInDocRef = doc(db, "reports", managementName, "daily", uniqueDocName); // Path to the new document
      const checkInData = {
          timestamp: timestamp, // Use Firebase server timestamp for consistency
          userDetails: updatedUserDetails,
          managementName: managementName,
          floorTitle: floorTitle,
          slotNumber: continuousSlotNumber,
          slotId: uniqueSlotId,
      };
  
      setDoc(checkInDocRef, checkInData, { merge: true })
        .then(() => {
          console.log(`Check-in data saved successfully for slot ${uniqueSlotId}`);
        })
        .catch((error) => {
          console.error("Error saving check-in data:", error);
        });
    setErrorMessage("");
    handleCloseModal();
  };
  const findPlateNumber = (plateNumber) => {
    return slotSets[currentSetIndex].slots.findIndex(
      (s) => s.userDetails && s.userDetails.carPlateNumber === plateNumber
    );
  };

  const findPlateAcrossFloors = (plateNumber) => {
    for (let i = 0; i < slotSets.length; i++) {
      const slots = slotSets[i].slots;
      for (let j = 0; j < slots.length; j++) {
        if (
          slots[j].occupied &&
          slots[j].userDetails &&
          slots[j].userDetails.carPlateNumber === plateNumber
        ) {
          setHighlightedFloorIndex(i); // Set the floor index
          setHighlightedSlot(j); // Set the slot index
          return { found: true, floorIndex: i, slotIndex: j };
        }
      }
    }
    return { found: false };
  };

  const sendEntryNotification = async (userDetails, floorTitle, slotIndex) => {
    if (!userDetails.userEmail) {
      console.error("User email is missing, cannot send notification.");
      return;
    }
    const userTokenDocRef = doc(db, "userTokens", userDetails.userEmail);
    const docSnap = await getDoc(userTokenDocRef);
    if (docSnap.exists()) {
      const { token } = docSnap.data();
      const notificationData = {
        appId: 24190,
        appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
        title: "Parking Slot Assigned",
        message: `Your parking slot on ${floorTitle} floor at slot number ${
          slotIndex + 1
        } is confirmed at ${managementName}.`,
        targetUsers: [token],
        subID: userDetails.userEmail,
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
        .then((text) =>
          console.log("Entry notification sent successfully:", text)
        )
        .catch((error) =>
          console.error("Error sending entry notification:", error)
        );
    } else {
      console.error(
        "No device token found for userEmail:",
        userDetails.userEmail
      );
    }
  };
  const renderSearchForm = () => {
    return (
      <div className="search-plate">
      <SearchForm
                onSearch={searchInFirebaseSecondInput} // Assuming you have a method to handle the search
                placeholder="Search car plate number"  // Custom placeholder for searching
      />
      </div>
    );
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
      <div style={{ marginTop: "20px", marginLeft: "40px" }}>
        <div
          className="notification-bell"
          onClick={handleNotificationClick }
          //   setShowNotification(!showNotification);
          //   setNotificationCount(0);
          // }}
        >
          <FontAwesomeIcon icon={faBell} size="lg" />
          {notificationCount > 0 && (
    <span className="badge rounded-pill bg-danger">
        {notificationCount}
    </span>
          )}
        </div>
        {showNotification && (
          <div className="notification-panel show">
            {notifications.length > 0 ? (
              renderNotifications()
            ) : (
              <p>No new notifications.</p>
            )}
          </div>
        )}
      <Tab.Container
  activeKey={currentSetIndex.toString()}
  onSelect={handleTabSelect} // Make sure this is correctly set
  defaultActiveKey="0"
>

          <Nav
          >
            {slotSets.map((slotSet, index) => (
              
              <Nav.Item
                key={index}
                style={{
                  width: "200px",
                  textAlign: "center",
                  border: "1px double", // Border for the entire item
                  borderLeft:index !== slotSets.length - 1 ? "1px double #132B4B" : "",
                  borderRight: index !== slotSets.length - 1 ? "1px double #132B4B" : "",
                  borderRadius:
                    index === 0
                      ? "10px 10px 10px 10px"
                      : index === slotSets.length - 1
                      ? "10px 10px 10px 10px "
                      : "10px 10px 10px 10px", // Rounded corners only for the first and last tab
                      overflow: "hidden", // Prevent overflow on border radius
                      marginBottom: "10px",
                      marginLeft: "10px",
                }}
              >
                <Nav.Link
                  eventKey={index.toString()}
                  style={{
                    borderRadius: "0", // Remove any inner radius
                    backgroundColor:
                      currentSetIndex === index ? "#132B4B" : "transparent",
                    color: currentSetIndex === index ? "white" : "black",
                    fontWeight: currentSetIndex === index ? "bold" : "normal",
                    padding: "10px 15px", // Adjust padding for consistency
                    height: "100%", // Ensure full height of the tab item
                  }}
                >
                  {slotSet.title}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
          <hr className="divider"/>
          {renderSearchForm()}
          <Tab.Content>
          {slotSets.map((slotSet, index) => (
  <Tab.Pane eventKey={index} key={index}>
    <h2 style={{
      textAlign: "center",
      textTransform: "uppercase",
      fontWeight: "bold",
      fontSize: "36px",
      color: "#132B4B",
      marginTop: "40px",
      marginBottom: "40px",
    }}>
      {slotSet.title} Floor{" "}
    </h2>
    <div className="parkingContainer">
      <div className="parkingGrid">
      {slotSet.slots.map((slot, slotIndex) => {
          const continuousNumber = getContinuousSlotNumber(index, slotIndex);
          let backgroundColor = 'green'; // Default color for available slots
        
          if (slot.occupied) {
            if (slot.from && slot.from.trim().toLowerCase() === "reservation") {
              backgroundColor = 'blue';
            } else {
              backgroundColor = 'red';
            }
          } 
  return (
    <div
      key={slotIndex}
      style={{
        width: "95px",
        height: "100px",
        backgroundColor: backgroundColor,
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        margin: "5px",
        borderRadius: "15px",
        boxShadow: slot.occupied ? "0 2px 4px #DC143C" : "0 2px 4px #00ff00",
        border: (highlightedFloorIndex === index && highlightedSlot === slotIndex) ? "3px solid yellow" : "",
      }}
      onClick={() => handleSlotClick(slotIndex)}
    >
      {slot.occupied ? (
        <div>
          <div>
            {slot.userDetails ? slot.userDetails.carPlateNumber : continuousNumber}
          </div>
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        setEnterPressed(true);
      }
    };

    // Add event listener only if the modal is shown
    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup the event listener on component unmount or when modal is hidden
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      setEnterPressed(false); // Reset on modal close
    };
  }, [showModal]);  
  const [showArrivedButton, setShowArrivedButton] = useState(false);


  const handleSlotClick = (index) => {
    const slot = slotSets[currentSetIndex].slots[index];
    setSelectedSlot(index);
    setShowModal(true);
    setUserDetails(slotSets[currentSetIndex].slots[index]?.userDetails || null);
    setShowAssignButton(!slot.occupied);
  setShowExitButton(slot.occupied);
  setEnterPressed(false);
  setShowExitConfirmation(false);
  if (slot.occupied && slot.from && slot.from.trim().toLowerCase() === "reservation") {
    setShowArrivedButton(true);
  } else {
    setShowArrivedButton(false);
  }
  };
  

  
  

  const handleArrived = (slotIndex) => {
    // Update the local state to reflect that the slot is now occupied
    const updatedSets = [...slotSets];
    const timestamp = new Date();
    const updatedUserDetails = updatedSets[currentSetIndex].slots[slotIndex].userDetails || {};
  
    updatedSets[currentSetIndex].slots[slotIndex] = {
      ...updatedSets[currentSetIndex].slots[slotIndex],
      occupied: true,
      from: "Arrived",
      timestamp: timestamp,
      userDetails: {
        ...updatedUserDetails,
        status: "Occupied",
      },
    };
  
    setSlotSets(updatedSets);
    saveSlotsToLocalStorage(user.managementName, updatedSets); // Save updated slots to local storage or update as per your logic
  
    // Update the slot status in Firestore
    const managementName = user.managementName;
    const floorTitle = slotSets[currentSetIndex].title || "General Parking";
    const uniqueDocName = `slot_${floorTitle}_${slotIndex}`;
    const managementDocRef = doc(db, "slot", managementName);
    const slotCollectionRef = collection(managementDocRef, "slotData");
    const slotDocRef = doc(slotCollectionRef, uniqueDocName);
  
    const slotUpdate = {
      status: "Occupied",
      userDetails: updatedUserDetails,
      from: "Arrived",
      timestamp: timestamp,
    };
  
    setDoc(slotDocRef, slotUpdate, { merge: true })
      .then(() => {
        console.log(
          `Slot ${slotIndex + 1} marked as "Arrived" and status updated in Firestore under management ${managementName}, floor ${floorTitle}`
        );
      })
      .catch((error) => console.error("Error updating slot status in Firestore:", error));
    
    // Close modal after updating
    handleCloseModal();
  };
  useEffect(() => {
    const fetchAndUpdateSlotData = async (slot, floorIndex, slotIndex) => {
      if (slot.from && slot.from.trim().toLowerCase() === "reservation") {
        const managementDocRef = doc(db, "slot", user.managementName);
        const slotCollectionRef = collection(managementDocRef, "slotData");
        const floorTitle = slotSets[floorIndex].title || "General Parking";
        const uniqueDocName = `slot_${floorTitle}_${slotIndex}`;
        const slotDocRef = doc(slotCollectionRef, uniqueDocName);
  
        const slotDocSnap = await getDoc(slotDocRef);
        if (slotDocSnap.exists()) {
          const slotData = slotDocSnap.data();
          const allocatedTimeInMinutes = parseInt(slotData.allocatedTimeForArrival, 10); // Allocated time in minutes
  
          if (allocatedTimeInMinutes && !isNaN(allocatedTimeInMinutes)) {
            const createdTime = slotData.timestamp.seconds * 1000; // Reservation creation timestamp in ms
            const expirationTime = createdTime + allocatedTimeInMinutes * 60 * 1000; // Expiration timestamp in ms
            const currentTime = Date.now();
  
            const remainingTimeInMs = expirationTime - currentTime;
            const remainingTimeInMin = Math.max(Math.floor(remainingTimeInMs / (60 * 1000)), 0); // Remaining time in minutes
  
            console.log(`Slot ${slotIndex} on floor "${floorTitle}" has ${remainingTimeInMin} minutes remaining.`);
  
            if (remainingTimeInMin <= 0) {
              // Timer expired
              console.log(`Timer expired for slot ${slotIndex} on floor ${floorTitle}`);
              await deleteDoc(slotDocRef); // Remove expired reservation
              return { ...slot, occupied: false, from: null, userDetails: null };
            } else {
              return { ...slot, remainingTime: remainingTimeInMin };
            }
          }
        }
      }
      return slot;
    };
  
    const checkReservationTimers = async () => {
      const updatedSets = await Promise.all(
          slotSets.map(async (slotSet, floorIndex) => ({
              ...slotSet,
              slots: await Promise.all(
                  slotSet.slots.map(async (slot, slotIndex) => {
                      if (slot.from && slot.from.trim().toLowerCase() === "reservation") {
                          const managementDocRef = doc(db, "slot", user.managementName);
                          const slotCollectionRef = collection(managementDocRef, "slotData");
                          const floorTitle = slotSets[floorIndex].title || "General Parking";
                          const uniqueDocName = `slot_${floorTitle}_${slotIndex}`;
                          const slotDocRef = doc(slotCollectionRef, uniqueDocName);
  
                          const slotDocSnap = await getDoc(slotDocRef);
                          if (slotDocSnap.exists()) {
                              const slotData = slotDocSnap.data();
                              const reservationTimestamp = slotData.timestamp.seconds * 1000; // Firestore timestamp
                              const allocatedTimeInMs = Number(slotData.allocatedTimeForArrival) * 60 * 1000;
                              const remainingTimeInMs = reservationTimestamp + allocatedTimeInMs - Date.now();
  
                              if (remainingTimeInMs <= 0) {
                                  console.log(`Timer expired for slot ${slotIndex} on floor ${floorTitle}`);
                                  await deleteDoc(slotDocRef); // Remove expired reservation
                                  return { ...slot, occupied: false, from: null, userDetails: null };
                              } else {
                                  const remainingTimeInMinutes = Math.ceil(remainingTimeInMs / 60000);
                                  console.log(`Slot ${slotIndex} on floor "${floorTitle}" has ${remainingTimeInMinutes} minutes remaining.`);
                                  return { ...slot, remainingTime: remainingTimeInMinutes };
                              }
                          }
                      }
                      
                      return slot;
                  })
              ),
          }))
      );
      setSlotSets(updatedSets);
  };
  
  
    // Use a properly configured interval to update timers
    const intervalId = setInterval(() => {
      checkReservationTimers();
    }, 60000); // Every minute
  
    return () => clearInterval(intervalId); // Cleanup the interval
  }, [slotSets, user.managementName, db]);
  
  const updateFirestore = async (floorTitle, slotIndex, additionalFee, exceedingLimit) => {
    const uniqueDocName = `slot_${floorTitle}_${slotIndex}`;
    const slotRef = doc(db, "slot", user.managementName, "slotData", uniqueDocName);
    const reportRef = doc(db, "reports", user.managementName, "daily", uniqueDocName);

    // Update the slot details
    try {
        await updateDoc(slotRef, {
            "userDetails.additionalFee": additionalFee,
            "userDetails.exceedingLimit": exceedingLimit
        });
        console.log(`Updated Firestore for slot ${uniqueDocName} with Additional Fee: ${additionalFee} and Exceeding Limit: ${exceedingLimit}`);
    } catch (error) {
        console.error("Failed to update Firestore for slot " + uniqueDocName, error);
    }

    // Check if the report exists, then update or create it
    const reportSnap = await getDoc(reportRef);
    if (reportSnap.exists()) {
        try {
            await updateDoc(reportRef, {
                "userDetails.additionalFee": additionalFee,
                "userDetails.exceedingLimit": exceedingLimit,
            });
            console.log(`Updated report for slot ${uniqueDocName} with Additional Fee: ${additionalFee} and Exceeding Limit: ${exceedingLimit}`);
        } catch (error) {
            console.error("Failed to update report for slot " + uniqueDocName, error);
        }
    } else {
        try {
            await setDoc(reportRef, {
                "userDetails": {
                    "additionalFee": additionalFee,
                    "exceedingLimit": exceedingLimit
                },
            });
            console.log(`Created report document for slot ${uniqueDocName} as it did not exist.`);
        } catch (error) {
            console.error("Failed to create report document for slot " + uniqueDocName, error);
        }
    }
};


  
  useEffect(() => {
    const updateSlotsDurations = () => {
      const updatedSets = [...slotSets];
      const currentTime = Date.now();
    
      updatedSets.forEach((slotSet) => {
        const floorTitle = slotSet.title;
        slotSet.slots.forEach((slot, slotIndex) => {
          if (slot.occupied) {
            const timestamp = slot.userDetails?.timestamp || slot.timestamp;
            if (timestamp) {
              const slotTimestamp = timestamp.seconds ? timestamp.seconds * 1000 : timestamp;
              const durationInMillis = currentTime - slotTimestamp;
              const durationInMinutes = Math.floor(durationInMillis / (1000 * 60));
    
              if (slot.userDetails?.gracePeriod && durationInMinutes > slot.userDetails.gracePeriod) {
                const additionalFee = (durationInMinutes - slot.userDetails.gracePeriod) * slot.userDetails.continuousParkingFee;
                const exceedingLimit = durationInMinutes - slot.userDetails.gracePeriod;
    
                // Only perform Firestore update if the calculated fee or limit changes
                if (slot.userDetails.additionalFee !== additionalFee || slot.userDetails.exceedingLimit !== exceedingLimit) {
                  // Update Firestore using floorTitle and slotIndex
                  updateFirestore(floorTitle, slotIndex, additionalFee, exceedingLimit);
                }
              } else if (slot.userDetails.additionalFee !== 0 || slot.userDetails.exceedingLimit !== 0) {
                updateFirestore(floorTitle, slotIndex, 0, 0);  // Reset fees in Firestore if within grace period
                slot.userDetails.additionalFee = 0;
                slot.userDetails.exceedingLimit = 0;
              }
            } else {
              console.log(`Slot ${slotIndex + 1} on floor "${slotSet.title}" is missing a timestamp.`);
            }
          }
        });
      });
  
      setSlotSets(updatedSets);
    };
  
    const intervalId = setInterval(() => {
      console.log("Updating slot durations...");
      updateSlotsDurations();
    }, 1000);  // Consider increasing this interval if possible to reduce load
  
    return () => clearInterval(intervalId);
  }, [slotSets]);
  
  


  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [tempUserDetails, setTempUserDetails] = useState(null);

  const handleExitSlot = async (slotIndex, carPlateNumber) => {
    // Check if the slot is already empty
    if (!slotSets[currentSetIndex].slots[slotIndex].occupied) {
      setErrorMessage("This slot is already empty.");
      return;
    }
    setShowExitConfirmation(true);
  };

  const sendExitNotification = async (userDetails, floorTitle, slotIndex) => {
    const userTokenDocRef = doc(db, "userTokens", userDetails.email);
    const docSnap = await getDoc(userTokenDocRef);

    if (docSnap.exists()) {
      const { token } = docSnap.data();
      const notificationData = {
        appId: 24190,
        appToken: "7xmUkgEHBQtdSvSHDbZ9zd",
        title: "Parking Slot Exited",
        message: `You have exited ${managementName} parking slot on ${floorTitle} floor at slot number ${
          slotIndex + 1
        }. Thank you for visiting!`,
        targetUsers: [token],
        subID: userDetails.email,
      };

      console.log(
        "Sending exit notification with data:",
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
          console.log("Exit notification sent successfully:", text);
        })
        .catch((error) => {
          console.error("Error sending exit notification:", error);
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
                userDetails: null,
              };
            }
            return slot;
          }),
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
    setErrorMessage("");
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = async (slotIndex, carPlateNumber) => {
    const managementDocRef = doc(db, "slot", managementName);
    const slotCollectionRef = collection(managementDocRef, "slotData");
    const floorTitle = slotSets[currentSetIndex].title || "General Parking";
    const slotDocRef = doc(
      slotCollectionRef,
      `slot_${floorTitle}_${slotIndex}`
    );
    const userDetails = slotSets[currentSetIndex].slots[slotIndex].userDetails;
    console.log("Entered Car Plate Number:", carPlateNumber);
    console.log("Carplate number", userDetails.carPlateNumber);
    console.log("User Details at exit:", userDetails);

    console.log("Carplate number", userDetails.carPlateNumber);
    console.log("User Details at exit:", userDetails);

    if (carPlateNumber !== userDetails.carPlateNumber) {
      console.error("Car plate number mismatch.");
      setErrorMessage(
        `Car plate number mismatch. Entered: ${carPlateNumber}, Expected: ${
          userDetails.carPlateNumber || "not registered"
        }. Please try again.`
      );
      return;
    }

    try {
      await deleteDoc(slotDocRef);
      console.log(
        `Slot ${slotIndex} data deleted from Firebase under ${managementName}`
      );

      // Only attempt to send notifications if userEmail is not empty
      if (userDetails.userEmail) {
        const userRef = collection(db, "user");
        const q = query(userRef, where("email", "==", userDetails.userEmail));
        const userSnap = await getDocs(q);

        if (!userSnap.empty) {
          await sendExitNotification(
            userSnap.docs[0].data(),
            floorTitle,
            slotIndex
          );
        } else {
          console.error("User not found in users collection");
        }
      } else {
        console.log(
          "No userEmail provided, exiting slot without sending notification."
        );
      }
    } catch (error) {
      console.error("Error processing slot exit:", error);
      setErrorMessage("Error processing slot exit. Please try again.");
    }

    updateSets(slotIndex);
    setShowExitConfirmation(false);
    handleCloseModal();
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };
  const handleCloseModal = () => {
    setShowModal(false); // Hide the modal
    setShowButtons(false); // Hide the buttons
    setShowConfirmation(false); // Hide the confirmation message
    setErrorMessage(""); // Clear any error messages
    setUserDetails({}); // Reset user details if necessary
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const renderNotifications = () => {
    const handleDeleteNotification = async (notificationId) => {
      try {
        const notificationRef = doc(db, "notifications", notificationId);
        await deleteDoc(notificationRef);
        setNotifications(notifications.filter(n => n.id !== notificationId));
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    };
  
    return (
      <table className="notification-table">
        <thead>
          <tr>
            <th>Notifications</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification, index) => (
            <tr key={index}>
              <td>
                {notification.details} by {notification.userEmail}
              </td>
              <td>
                <button onClick={() => handleDeleteNotification(notification.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  useEffect(() => {
    searchInFirebase(userDetails?.carPlateNumber);
  }, [userDetails?.carPlateNumber]);

  console.log(userDetails?.carPlateNumber);
  console.log("Hello");

  return (
    <div className="d-flex">
      <div>
        <div className="admin-dashboard">
          <Sidebar />

          <div style={{ flex: 1, padding: "10px" }}>
            {slotSets.length > 0 ? renderFloorTabs() : <p>Loading floors...</p>}
          </div>
           <Modal show={showImageUploadModal} onHide={handleCloseImageUploadModal}>
            <Modal.Header closeButton>
              <Modal.Title>Image Uploaded</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              User {uploadedByEmail} has uploaded an image for their reservation.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseImageUploadModal}>
                OK
              </Button>
            </Modal.Footer>
          </Modal>

         


          <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Parking Slot {selectedSlot + 1}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: "#fff8c9" }}>
              {errorMessage && (
                <div style={{ color: "red" }}>{errorMessage}</div>
              )}
              {selectedSlot !== null && !slotSets[currentSetIndex].slots[selectedSlot].occupied && (
                <SearchForm
                  onSearch={searchInFirebase}
                  onSelectSlot={(carPlateNumber) =>
                    handleAddToSlot(carPlateNumber, selectedSlot)
                  }
                  onExitSlot={(carPlateNumber) =>
                    handleExitSlot(selectedSlot, carPlateNumber)
                  }
                  selectedSlot={selectedSlot}
                  slotOccupied={
                    slotSets[currentSetIndex].slots[selectedSlot].occupied
                  }
                  handleOnChange={handleOnChange}
                  userDetails={userDetails}
                />
              )}
                {selectedSlot !== null && slotSets[currentSetIndex].slots[selectedSlot].occupied && (
      <div>
        {/* Display additional fee and exceeding limit */}
        <div style={{ marginBottom: "10px" }}>
          <strong>Additional Fee: </strong>
          {slotSets[currentSetIndex].slots[selectedSlot].userDetails.additionalFee > 0
            ? `PHP: ${slotSets[currentSetIndex].slots[selectedSlot].userDetails.additionalFee}`
            : "No additional fee"}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Exceeding Limit: </strong>
          {slotSets[currentSetIndex].slots[selectedSlot].userDetails.exceedingLimit > 0
            ? `${slotSets[currentSetIndex].slots[selectedSlot].userDetails.exceedingLimit} minutes`
            : "No exceeding limit"}
        </div>
      </div>
    )}
              {selectedSlot !== null && userDetails && (
                <div className="user-details">
                  <h4 style={{ fontFamily: "Copperplate", fontWeight: "bold" }}>
                    User Details:
                  </h4>
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
                      <span class="value">
                        {slotSets[currentSetIndex].slots[
                          selectedSlot
                        ].timestamp.toString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
             {showAssignButton && enterPressed && (
      <button
        className="btn btn-custom-assign"
        onClick={() => handleAddToSlot(userPlateNumber, selectedSlot)}
      >
        Assign
      </button>
    )}{showExitButton && (
      <button
        className="btn btn-custom-exit"
        onClick={() => handleExitSlot(selectedSlot)}
      >
        Exit
      </button>
    )}
    {showArrivedButton && (
      <button
        className="btn btn-custom-arrived"
        onClick={() => handleArrived(selectedSlot)}
      >
        Arrived
      </button>
    )}
              {showConfirmation && (
                <div>
                  <p style={{ marginTop: "10px", fontFamily: "Copperplate" }}>
                    No record found. Do you want to proceed?
                  </p>
                  <button
                    className="btn-custom-no"
                    onClick={() => setShowConfirmation(false)}
                  >
                    No
                  </button>
                  <button
                    className="btn-custom-yes"
                    onClick={() => {
                      // Check again if the slot is not occupied before allowing assignment
                      const slot =
                        slotSets[currentSetIndex].slots[selectedSlot];
                      if (!slot.occupied) {
                        handleAddToSlot(userPlateNumber, selectedSlot);
                        setShowConfirmation(false);
                      } else {
                        setErrorMessage(
                          "Car plate number is already parked."
                        );
                        setShowConfirmation(false);
                      }
                    }}
                  >
                    Yes
                  </button>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              {recordFound ? null : (
                <div style={{ color: "red" }}>
                  No record found for this car plate number.
                </div>
              )}
            </Modal.Footer>
          </Modal>
          <Modal show={showExitConfirmation} onHide={handleCancelExit}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to vacant this slot?</Modal.Body>
            <Modal.Footer>
              <button className="btn-custom-no" onClick={handleCancelExit}>
                No
              </button>
              <button className="btn-custom-yes"   onClick={() => handleConfirmExit(selectedSlot, userPlateNumber)}>
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