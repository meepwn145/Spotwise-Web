import React, { useContext, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.css";
import { DropdownButton, Dropdown, Button } from "react-bootstrap";
import { FaUserCircle, FaCar, FaRegListAlt } from "react-icons/fa";
import Card from "react-bootstrap/Card";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem } from "mdb-react-ui-kit";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faChartColumn, faAddressCard, faPlus, faCar, faUser, faCoins, faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import UserContext from "../UserContext";
import { auth, db } from "../config/firebase";
import { getDocs, collection, query, where, doc, getDoc } from "firebase/firestore";
import { logoutUser } from "./auth";
import EstablishmentReserve from "./establishmentReserve";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import "./sideNavigation.css"

const Establishment = () => {
    const [agent, setAgent] = useState([]);
    const [parkingSeeker, setParkingSeeker] = useState([]);
    const [summaryCardsData, setSummaryCardsData] = useState([]);
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [reserveLogs, setReserveLogs] = useState([]);
    const [activeCard, setActiveCard] = useState('');
    const [reservedSpaces, setReservedSpaces] = useState(0);
    const [occupiedSpaces, setOccupiedSpaces] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser } = useContext(UserContext);
    const [parkingLogs, setParkingLogs] = useState([]);
    const [managementName, setManagementName] = useState(user.managementName || "");
    const [address, setAddress] = useState(user.companyAddress || "");
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalSlots, setTotalSlots] = useState(user.totalSlots || "");
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [parkingPay, setParkingPay] = useState(0);
    const [availableSlots, setAvailableSlots] = useState(0);
    const [occupiedSlots, setOccupiedSlots] = useState(0);  // State to keep track of occupied slots
    const [walkInCount, setWalkInCount] = useState(0);
    const [reservationCount, setReservationCount] = useState(0);
    const [reservationDuration, setReservationDuration] = useState(0);

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
        sectionHeader: {
            fontWeight: "bold", // Make text bold
            fontSize: "16px",   // Optional: adjust size if needed
            color: "#333",      // Optional: set color if needed
            display: "flex",
            alignItems: "center",
        },
        icon: {
          marginRight: "5px",
        },
      };
    const totalRevenues = totalUsers * parkingPay;
    const updateInterval = 1000;

    const chartContainerStyle = {
        display: "flex",          // Display items in a row
        justifyContent: "center",  // Center align the charts
        padding: "20px",           // Optional padding around the container
        margin: "20px",  // Add this line to increase spacing around each chart card
    
      };
      
      const chartCardStyle = {
        backgroundColor: "#f8f9fa",
        borderRadius: "15px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)",
        padding: "20px",
        width: "100%",
        maxWidth: "500px",  // Increase the max width to make the chart wider
        textAlign: "center",
        margin: "10px",
    };
    
    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.uid) : null;
    useEffect(() => {
        const fetchParkingData = async () => {
          try {
            const managementName = user.managementName;
      
            // Query for all occupied slots
            const occupiedSlotsQuery = query(
              collection(db, `slot/${managementName}/slotData`),
              where("status", "==", "Occupied")
            );
            const occupiedSnapshot = await getDocs(occupiedSlotsQuery);
      
            // Separate reservations and walk-ins based on the presence of the reserveStatus field
            let reservationCount = 0;
            let walkInCount = 0;
      
            occupiedSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.reserveStatus) {
                // Entry has reserveStatus; it's a reservation
                reservationCount += 1;
              } else {
                // No reserveStatus field; consider it a walk-in
                walkInCount += 1;
              }
            });
      
            setReservationCount(reservationCount);
            setWalkInCount(walkInCount);
      
            // Update occupancy data
            setOccupiedSlots(reservationCount + walkInCount);
            setAvailableSlots(totalSlots - (reservationCount + walkInCount));
          } catch (error) {
            console.error("Error fetching parking data:", error);
          }
        };
      
        if (user && user.managementName) {
          fetchParkingData();
        }
      }, [user]);
      
    
      // Data for the Doughnut Chart
      const total = reservationCount + walkInCount;
const doughnutData = total > 0
    ? [
        { name: "Reserved", value: reservationCount },
        { name: "Walk-ins", value: walkInCount }
      ]
    : [
        { name: "No Data", value: 1 }
      ];

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

    useEffect(() => {
        const fetchParkingLogs = async () => {
            try {
                const currentUserManagementName = user.managementName;
                const logsCollectionRef = collection(db, "logs");
                const q = query(logsCollectionRef, where("managementName", "==", currentUserManagementName));

                const querySnapshot = await getDocs(q);
                const logs = [];
                querySnapshot.forEach((doc) => {
                    logs.push({ id: doc.id, ...doc.data() });
                });
                setParkingLogs(logs);
                const totalUser = logs.length;
                setTotalUsers(totalUser);
            } catch (error) {
                console.error("Error fetching parking logs: ", error);
            }
        };

        if (user && user.managementName) {
            fetchParkingLogs();
        }
    }, [user, db]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (auth.currentUser) {
                    const userId = auth.currentUser.uid;

                    const doc = await db.collection("establishments").doc(userId).get();

                    if (doc.exists) {
                        const userData = doc.data();

                        setManagementName(userData.managementName || "");
                        setAddress(userData.address || "");
                    } else {
                        console.log("No user data found!");
                    }
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchEstablishmentData = async () => {
            try {
                const q = query(collection(db, 'establishments'), where('managementName', '==', user.managementName));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const establishmentData = querySnapshot.docs[0].data();
                    setParkingPay(establishmentData.parkingPay);
                    setTotalSlots(establishmentData.totalSlots);
                    setReservationDuration(establishmentData.reservationDuration);

                }
            } catch (error) {
                console.error('Error fetching establishment data:', error);
            }
        };

        if (user && user.managementName) {
            fetchEstablishmentData();
            fetchParkingSlots(user.managementName);
            fetchOccupiedAndReservedSlotData(); // Combined function to fetch both
        }
    }, [user]);

    const formatDateAndTime = (timestamp) => {
        if (!timestamp) {
            return 'No Timestamp';
        }
        // Check if timestamp is a Firestore Timestamp
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) { // Check if the date is valid
            return 'Invalid Date';
        } else {
            // Options to format the date in a 'Month day, year, time' format
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            return date.toLocaleString('en-US', options); // 'en-US' can be adjusted to your locale
        }
    };

    const fetchParkingSlots = async (managementName) => {
        try {
            const establishmentQuery = query(collection(db, "establishments"), where("managementName", "==", managementName));
            const establishmentSnapshot = await getDocs(establishmentQuery);
            if (establishmentSnapshot.empty) {
                return;
            }

            let totalSlots = 0;
            establishmentSnapshot.forEach(doc => {
                totalSlots = doc.data().totalSlots;
            });

            const slotDataQuery = query(collection(db, `slot/${managementName}/slotData`));
            const slotDataSnapshot = await getDocs(slotDataQuery);
            const occupiedSlots = slotDataSnapshot.size;

            const available = totalSlots - occupiedSlots;
            setAvailableSlots(available);
        } catch (error) {
            console.error("Error fetching parking data: ", error);
            setAvailableSlots(0);
        }
    };

    const fetchOccupiedAndReservedSlotData = async () => {
        try {
            const currentUserManagementName = user.managementName;
            const logsCollectionRef = collection(db, 'slot', currentUserManagementName, 'slotData');

            const querySnapshot = await getDocs(logsCollectionRef);
            const slots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter for occupied slots
            const occupiedSlots = slots.filter(slot => slot.status === "Occupied");
            setParkingLogs(occupiedSlots);
            setOccupiedSpaces(occupiedSlots.length);

            // Filter for reserved slots
            const reservedSlots = slots.filter(slot => slot.from === "Reservation");
            setReserveLogs(reservedSlots);
            setReservedSpaces(reservedSlots.length);
        } catch (error) {
            console.error("Error fetching slot data: ", error);
            setOccupiedSpaces(0);
            setReservedSpaces(0);
        }
    };

    useEffect(() => {
        const fetchEstablishments = async () => {
            const querySnapshot = await getDocs(collection(db, "establishments"));
            setEstablishments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchEstablishments();
        const fetchPendingAccounts = async () => {
            const querySnapshot = await getDocs(query(collection(db, "pendingEstablishments")));
            setPendingAccounts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchPendingAccounts();
    }, []);

    useEffect(() => {
        setSummaryCardsData([
            {
                title: 'Total Parking Spaces',
                value: `${totalSlots} Total Parking Spaces`,
                imgSrc: 'totalPark.png',
                cardType: 'total',
                clickable: false
            },
            {
                title: 'Available Spaces',
                value: `${availableSlots} Available Spaces`,
                imgSrc: 'available.png',
                cardType: 'available',
                clickable: false
            },
            {
                title: 'Occupied Spaces',
                imgSrc: 'occupied.png',
                cardType: 'occupied',
                clickable: true
            },
            {
                title: 'Occupied by Reservation',
                imgSrc: 'reservedP.png',
                cardType: 'reserve',
                clickable: true
            },
        ]);
    }, [totalSlots, availableSlots, occupiedSpaces, reservedSpaces]);

    const handleCardClick = (cardType) => {
        console.log(`Card clicked: ${cardType}`);
        setActiveCard(activeCard === cardType ? '' : cardType);
    };

    const handleLogOut = async () => {
        try {
          await logoutUser();
          // Perform any additional cleanup or state updates
          setUser(null);  // Assuming setUser updates the user state context
          navigate('/');  // Redirect to the login page or any other appropriate route
        } catch (error) {
          console.error('Failed to log out:', error);
        }
      };

    const renderFormBasedOnCardType = () => {
        switch (activeCard) {
            case 'occupied':
                return (
                    <div style={styles.occupiedSection}>
                    
                        <table class="table table-striped table-hover table-bordered">
                            <thead className="bg-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Plate Number</th>
                                    <th>Floor</th>
                                    <th>Slot Number</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parkingLogs.map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.userDetails.name}</td>
                                        <td>{log.userDetails.carPlateNumber}</td>
                                        <td>{log.userDetails.floorTitle}</td>
                                        <td>{log.userDetails.slotId + 1}</td>
                                        <td>{log.from === 'Reservation' ? log.from : log.status}</td>
                                        <td>{formatDateAndTime(log.userDetails.timestamp || log.timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'reserve':
                return (
                    <div style={styles.reserveSection}>
                        <table class="table table-striped table-hover table-bordered">
                            <thead className="bg-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Plate Number</th>
                                    <th>Floor</th>
                                    <th>Slot Number</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reserveLogs.map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.userDetails.name}</td>
                                        <td>{log.userDetails.carPlateNumber}</td>
                                        <td>{log.userDetails.floorTitle}</td>
                                        <td>{log.userDetails.slotId + 1}</td>
                                        <td>{log.from}</td>
                                        <td>{formatDateAndTime(log.timestamp)}</td>
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
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(2) : 0;
 // Data for the Pie Chart
 
  const pieData = [
  { name: "Occupied", value: occupiedSlots },
  { name: "Available", value: availableSlots }
];

  // Colors for the Pie Chart
  const OCCUPANCY_COLORS = ["#ff0000", "#008000"];
    

    return (
        <section>
            <div className="admin-dashboard">
                <div className="sidebar">
                <div className="admin-container">
                    </div>
                    <div className="wrapper">
                        <div className="side">
                            
                            <EstablishmentReserve />

                        </div>
                    </div>
                    <div className="container">

            </div>
                </div>
                <div className="gradient-custom-2" style={{ backgroundColor: 'white' }}>
                        <div className="container">
                        
                        </div>
                        
                    <MDBContainer className="py-4">
                        
                        <MDBRow>
                            <MDBCol lg="2">
                            </MDBCol>
                            <MDBCol lg="8">
                                
                                <div className="summary-cards">
                                {summaryCardsData.map(card => (
                                    <div
                                        key={card.title}
                                        className={`card ${card.clickable ? 'card-clickable' : 'card-non-clickable'}`}
                                        onClick={() => card.clickable ? handleCardClick(card.cardType) : null}
                                        style={card.clickable ? { ...styles.card, ...styles.activeCard } : styles.nonClickableCard}
                                    >
                                        <img src={card.imgSrc} alt={card.title} className="card-image" />
                                        <div className="card-content">
                                            <div className="card-title">{card.title}</div>
                                            <div className="card-value">{card.value}</div>
                                        </div>
                                        {card.clickable && <span className="click-indicator">Click for details</span>}
                                    </div>
                                ))}

                                </div>
                                
                                {renderFormBasedOnCardType()}
                       
    
                            </MDBCol>
                            <div>Reservation Duration: {reservationDuration} Minutes</div>

                        </MDBRow>
                        
                    </MDBContainer> 
                    <hr className="divider" />
                    <div style={chartContainerStyle}>
                                    
                                    <div style={chartCardStyle}>
                                        <h5>Current Occupancy Rate</h5>
                                        <h6>{occupancyRate}%</h6>
                                        <ResponsiveContainer width={450} height={300}>  
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                
                                    <div style={chartCardStyle}>
                                        <h5>Reservation vs. Walk-In</h5>
                                        <ResponsiveContainer width={450} height={350}>  
                                            <PieChart>
                                                <Pie
                                                    data={doughnutData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    fill="#8884d8"
                                                    label={({ name, value }) => `${name}: ${((value / total) * 100).toFixed(1)}%`}
                                                >
                                                    {doughnutData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `${value} (${((value / total) * 100).toFixed(1)}%)`} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                    

                   
                </div>
            </div>
            
        </section>
    );
};

export default Establishment;
