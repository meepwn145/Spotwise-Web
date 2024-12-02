import React, { useState, useEffect, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Table, Button, Row, Col } from "react-bootstrap";
import { db, auth } from "../config/firebase";
import { collection, onSnapshot, Timestamp, where, getDocs, deleteDoc, query } from "firebase/firestore";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem } from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import { MDBBtn, MDBTable } from 'mdb-react-ui-kit';
import {  doc, getDoc } from "firebase/firestore";
import EstablishmentReserve from "./establishmentReserve";
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
const customListItemStyle = {
    border: "none", // Remove border from list items
    backgroundColor: "#FFFFFF",
};
const App = () => {
    const { user } = useContext(UserContext); // Initialize user first
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [managementName, setManagementName] = useState(user ? user.managementName : "");
    const [address, setAddress] = useState(user.companyAddress || "");
    const [showAccountingPage, setShowAccountingPage] = useState(false);
    const [showCustomer, setShowCustomer] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [parkingLogs, setParkingLogs] = useState([]);
    const [scheduleData, setScheduleData] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slotData, setSlotData] = useState([]);
    const [showOperatorManagement, setShowOperatorManagement] = useState(true);
    const [operators, setOperators] = useState([]);
    const handleShowOperatorManagement = () => {
        setShowOperatorManagement(true);
    };
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
    // Fetch only operators associated with the logged-in establishment
    const fetchOperators = async () => {
        if (user && user.managementName) { // Ensure the establishment name is available
            const agentsCollectionRef = collection(db, "agents");
            const q = query(agentsCollectionRef, where("managementName", "==", user.managementName)); // Filter by establishment
            const querySnapshot = await getDocs(q);
            const agentsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setOperators(agentsData);
        }
    };
    fetchOperators();
}, [user]); // Run this effect whenever the user context changes
    // Function to remove an operator with a confirmation prompt
    const handleRemoveOperator = async (operatorId) => {
        const confirmDelete = window.confirm("Are you sure you want to remove this operator?");
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, "agents", operatorId));
                // Update the operators list after deletion
                setOperators((prevOperators) => prevOperators.filter((operator) => operator.id !== operatorId));
                alert("Operator removed successfully");
            } catch (error) {
                console.error("Error removing operator: ", error);
                alert("Failed to remove operator");
            }
        }
    };
    const handleViewProfile = () => {
        navigate("/Profiles");
    };
    const handlelogin = () => {
        navigate("/");
    };
    const navigate = useNavigate();

    const listItemHoverStyle = {
        backgroundColor: "#003851",
    };
    const handleAgentSchedule = () => {
        navigate("/AgentSchedule");
    };

    const handleRevenues = () => {  
        navigate("/Tracks");
    };

    const handleRegister = () => {
        navigate("/AgentRegistration");
    };

    const handleFeed = () => {
        navigate("/Feedback");
    };

    const handleShowAccountingPage = () => {
        setShowAccountingPage(true);
        setShowCustomer(false);
        setShowSchedule(false);
    };

    const handleShowCustomer = () => {
        setShowAccountingPage(false);
        setShowCustomer(true);
        setShowSchedule(false);
    };

    const handleSchedule = () => {
        setShowAccountingPage(false);
        setShowCustomer(false);
        setShowSchedule(true);
    };

    const transactions = [
        { id: 1, date: "2023-08-13", description: "Sale", amount: 500 },
        { id: 2, date: "2023-08-14", description: "Expense", amount: -100 },
    ];

    useEffect(() => {
        const fetchParkingLogs = async () => {
            if (!user || !user.managementName) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const currentUserManagementName = user.managementName;
                const logsCollectionRef = collection(db, "slot");

                const q = query(logsCollectionRef, where("managementName", "==", currentUserManagementName));

                const querySnapshot = await getDocs(q);
                const logs = [];
                querySnapshot.forEach((doc) => {
                    logs.push({ id: doc.id, ...doc.data() });
                });
                setParkingLogs(logs);
                console.log ("ASDSADAS", parkingLogs)
            } catch (error) {
                console.error("Error fetching parking asdasd: ", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.managementName) {
            fetchParkingLogs();
        }
    }, [user, db]);

    useEffect(() => {
        const scheduleRef = collection(db, "schedule");

        const unsubscribe = onSnapshot(scheduleRef, (snapshot) => {
            const newData = snapshot.docs.map((doc) => doc.data());
            setScheduleData(newData);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const scheduleRef = collection(db, "parkingLogs");

        const unsubscribe = onSnapshot(scheduleRef, (snapshot) => {
            const newData = snapshot.docs.map((doc) => doc.data());
            setRevenue(newData);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const fetchSlotData = async () => {
        setLoading(true);
        try {
            const slotDataCollectionRef = collection(db, "slot", user.managementName, "slotData");
            const querySnapshot = await getDocs(slotDataCollectionRef);
            const slotData = [];
            querySnapshot.forEach((doc) => {
                slotData.push({ id: doc.id, ...doc.data() });
            });
            setSlotData(slotData);
            console.log("Fetched Slot Data: ", slotData);
        } catch (error) {
            console.error("Error fetching slot data: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlotData();
    }, []);

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

    useEffect(() => {
        const fetchEstablishment = async () => {
            if (!user || !user.managementName) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const currentUserManagementName = user.managementName;
                const logsCollectionRef = collection(db, "establishments");

                const q = query(logsCollectionRef, where("managementName", "==", currentUserManagementName));

                const querySnapshot = await getDocs(q);
                const logs = [];
                querySnapshot.forEach((doc) => {
                    logs.push({ id: doc.id, ...doc.data() });
                });
                setParkingLogs(logs);
                console.log ("ASDSADAS", parkingLogs)
            } catch (error) {
                console.error("Error fetching parking asdasd: ", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.managementName) {
            fetchEstablishment();
        }
    }, [user, db]);

    const styles = {
        welcomeMessage: {
            position: "absolute",
            top: "10px",
            right: "10px",
            margin: "0",
            color: "#fff",
            fontFamily: "Georgina",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
        },
        icon: {
            marginRight: "5px",
        },
    };

    return (
        <section>
            <div className="admin-dashboard">
                <div className="sidebar">
                    <EstablishmentReserve onOperatorManagementClick={handleShowOperatorManagement} />
                </div>

                <Container style={{ marginTop: '15vh' }}>
                    <h2 style={{ fontSize: 50, marginTop: '10px' }}>Management Details Page</h2>
                    <hr className="divider" style={{ color: '#132B4B', marginBottom: '40px' }} />
                    <Button
                    onClick={handleShowOperatorManagement}
                    style={{
                        backgroundColor: '#003851',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        borderRadius: '50px',
                        display: 'block', // Ensures it takes full width in its container
                        margin: '0 auto', // Centers the button horizontally
                    }}
                    className="btn-lg"
                >
                    Operator Management
                </Button>

                    {showOperatorManagement && (
                        <div>
                            <h3 className="text-center mb-4"><i className="fas fa-users"></i></h3>
                            {operators.length === 0 ? (
                                <p className="text-center">No operator registered</p> // Display message if no operators
                            ) : (
                            <Table striped bordered hover responsive className="text-center">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th>Operator Name</th>
                                        <th>Management Name</th>
                                        <th>Contact Number</th>
                                        <th>Role</th>
                                        <th>Actions</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {operators.map((operator) => (
                                        <tr key={operator.id}>
                                            <td>{operator.firstName} {operator.lastName}</td>
                                            <td>{operator.managementName}</td> 
                                            <td>{operator.phoneNumber}</td>
                                            <td>Parking Operator</td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleRemoveOperator(operator.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                                                        )}

                        </div>
                    )}
                </Container>
            </div>
        </section>
    );
};

export default App;