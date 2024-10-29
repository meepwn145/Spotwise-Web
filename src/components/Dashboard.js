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

    const totalRevenues = totalUsers * parkingPay;
    const updateInterval = 1000;

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
                value: `${occupiedSpaces} Occupied Spaces`,
                imgSrc: 'occupied.png',
                cardType: 'occupied',
                clickable: true
            },
            {
                title: 'Reserve Spaces',
                value: `${reservedSpaces} Reserved Spaces`,
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
                        <div style={styles.sectionHeader}><FaCar style={styles.icon} /> Occupied Slots</div>
                        <table className="table align-middle mb-0 bg-white">
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
                        <div style={styles.sectionHeader}><FaRegListAlt style={styles.icon} /> Reserved Slots</div>
                        <table className="table align-middle mb-0 bg-white">
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

    const styles = {
      
    };

    return (
        <section>
            <div className="admin-dashboard">
                <div className="sidebar">
                    <div className="admin-container">
                    </div>
                    <div className="wrapper">
                        <div className="side">
                            <div>
                                {profileImageUrl ? <MDBCardImage src={profileImageUrl} alt="Operator Profile Logo" className="rounded-circle" style={{ width: "70px"}} fluid /> : <MDBCardImage src="default_placeholder.jpg" alt="Default Profile Logo" className="rounded-circle" style={{ width: "70px", marginTop: '-6vh' }} fluid />}
                                <p style={{ fontFamily: "Georgina", fontSize: "20px", border: "white", fontWeight: "bold", colo: 'white'}}>{managementName}</p>
                            </div>
                            <h2>Menu</h2>
                            <ul>
                                <li><a href="Dashboard"><i className="fas fa-home"></i>Home</a></li>
                                <li><a href='AgentRegistration'><i className="fas fa-user"></i>Operator Registration</a></li>
                                <li><a href='Tracks'><i className="fas fa-project-diagram"></i>Management Details</a></li>
                                <li><a href="Profiles"><i className="fas fa-blog"></i>Profile</a></li>
                                <li><a href="Feedback"><i className="fas fa-blog"></i>Feedback</a></li>
                                <li><a onClick={handleLogOut}><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
                            </ul>
                        </div>
                    </div>
                    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#132B4B', position: "fixed", width: "500vh", marginLeft: '-150vh',height: '15%', marginTop: '-8%'}}>
                        <div className="container">
                            <Link className="navbar-brand" to="/Dashboard" style={{ fontSize: "25px"}}>
                            </Link>
                        </div>
                    </nav>
                </div>
                <div className="gradient-custom-2" style={{ backgroundColor: 'white' }}>
                    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#132B4B" }}>
                        <div className="container">
                            <a className="navbar-brand" style={{ padding: 20 }}>
                            </a>
                        </div>
                    </nav>
                    <MDBContainer className="py-4">
                        <MDBRow>
                            <MDBCol lg="4">
                            </MDBCol>
                            <MDBCol lg="8">
                                <div className="summary-cards">
                                    {summaryCardsData.map(card => (
                                        <div key={card.title} className={`card card-${card.cardType}`}
                                            onClick={() => card.clickable ? handleCardClick(card.cardType) : null}
                                            style={card.clickable ? (activeCard === card.cardType ? { ...styles.card, ...styles.activeCard } : styles.card) : styles.nonClickableCard}>
                                            <img src={card.imgSrc} alt={card.title} className="card-image" />
                                            <div className="card-content">
                                                <div className="card-title">{card.title}</div>
                                                <div className="card-value">{card.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <hr className="divider" />
                                {renderFormBasedOnCardType()}
                            </MDBCol>
                        </MDBRow>
                    </MDBContainer>
                </div>
            </div>
        </section>
    );
};

export default Establishment;
