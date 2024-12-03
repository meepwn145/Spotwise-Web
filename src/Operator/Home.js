import { useState, useEffect, useContext } from "react";
import { Card, Table, Container, Form, DropdownButton, Dropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaUserCircle, FaCar } from "react-icons/fa";
import { faCar, faCoins, faUser, faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import { db } from "../config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import UserContext from "../UserContext";
import OperatorReserve from "./operatorReserve";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardBody, MDBTypography } from "mdb-react-ui-kit";
import { Tab, Nav, Row, Col } from "react-bootstrap";
import Sidebar from './Sidebar'; 

function Home() {
  const { user, setUser } = useContext(UserContext);
  const [reservationCount, setReservationCount] = useState(0);
  const [walkInCount, setWalkInCount] = useState(0);
  const [agentFirst, setAgentFirstName] = useState(user.firstName || "");
  const [agentLastName, setAgentLastName] = useState(user.lastName || "");
  const agentFullName = `${agentFirst} ${agentLastName}`;
  const [data, setData] = useState([]);
  const [hourlyRevenueData, setHourlyRevenueData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [floorUsage, setFloorUsage] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [managementName, setManagementName] = useState(user.managementName || "");
  const [parkingPay, setParkingPay] = useState(0);
  const [numberOfParkingLots, setNumberOfParkingLots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);
  const [parkingLogs, setParkingLogs] = useState([]);
  const totalRevenues = totalUsers * parkingPay;
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenueToday, setTotalRevenueToday] = useState(0);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [occupiedSlots, setOccupiedSlots] = useState(0);  // State to keep track of occupied slots
  const [reservedSlots, setReservedSlots] = useState(0); // Define reservedSlots state
  const [reservedSpaces, setReservedSpaces] = useState(0);
  const [reservationDuration, setReservationDuration] = useState(0);

  const chartContainerStyle = {
    display: "flex",          // Display items in a row
    justifyContent: "center",  // Center align the charts
    padding: "20px",           // Optional padding around the container
    margin: "20px",  // Add this line to increase spacing around each chart card

  };
  const dividerStyle = {
    width: "1px", 
    height: "40px", 
    background: "linear-gradient(to bottom, #0b0e16, #00c6ff)", 
    borderRadius: "2px", 
    margin: "0 0px", // Reduce the horizontal margin to bring elements closer
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
  };
  
  
  const chartCardStyle = {
    backgroundColor: "#f8f9fa", // Light background similar to the example
    borderRadius: "15px",       // Rounded corners
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)", // Soft shadow
    padding: "20px",            // Padding for spacing
    width: "100%",              // Set width to take available space
    maxWidth: "470px",          // Limit max width for each chart card
    textAlign: "center",        // Center text alignment
    margin: "10px",  // Add this line to increase spacing around each chart card

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
  // Navigation handler for card types
  const handleNavigation = (cardType) => {
    navigate('/OperatorDashboard', { state: { activeCard: cardType } });
  };
  
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
  const doughnutData = [
    { name: "Reserved", value: reservationCount },
    { name: "Walk-ins", value: walkInCount },
  ];

  useEffect(() => {
    const fetchEstablishmentData = async () => {
      try {
        const q = query(collection(db, "establishments"), where("managementName", "==", user.managementName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const establishmentData = querySnapshot.docs[0].data();
          setParkingPay(establishmentData.parkingPay);
          setTotalSlots(establishmentData.totalSlots);
          setReservationDuration(establishmentData.reservationDuration);
          const newUser = {
            ...user,
            coordinates: establishmentData.coordinates,
          };
          setUser(newUser);
        }
      } catch (error) {
        console.error("Error fetching establishment data:", error);
      }
    };

    if (user && user.managementName) {
      fetchEstablishmentData();
      fetchParkingSlots(user.managementName);
    }
  }, [user, setUser, db]);

  const fetchParkingSlots = async (managementName) => {
    try {
      const slotDataQuery = query(collection(db, `slot/${managementName}/slotData`));
      const slotDataSnapshot = await getDocs(slotDataQuery);
      const currentUserManagementName = user.managementName;
      const logsCollectionRef = collection(db, 'slot', currentUserManagementName, 'slotData');
      const querySnapshot = await getDocs(logsCollectionRef);
      const slots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalOccupied = slotDataSnapshot.docs.filter(doc => doc.data().status === "Occupied").length;
      setOccupiedSlots(totalOccupied);
      setAvailableSlots(totalSlots - totalOccupied);  // Calculate available slots

      const reservedSlots = slots.filter(slot => slot.from === "Reservation");
      setReservedSpaces(reservedSlots.length);
    } catch (error) {
      console.error("Error fetching parking data:", error);
      setAvailableSlots(0);
      setReservedSlots(0);

    }
  };

  useEffect(() => {
    const fetchParkingLogs = async () => {
      if (!user || !user.managementName) return;
      
      const logsCollectionRef = collection(db, "logs", user.managementName, "floors");
      const q = query(logsCollectionRef, where("managementName", "==", user.managementName), where("paymentStatus", "==", "Paid"));
      const querySnapshot = await getDocs(q);

      let floorCount = {};
      let hourlyRevenue = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const floor = data.floorTitle;
        const revenue = parkingPay;
        const hour = new Date(data.timestamp.seconds * 1000).getHours();

        floorCount[floor] = (floorCount[floor] || 0) + 1;
        hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + revenue;
      });

      const sortedHours = Object.keys(hourlyRevenue).sort((a, b) => +a - +b);
      let cumulativeRevenue = 0;
      const cumulativeRevenueData = sortedHours.map((hour) => {
        cumulativeRevenue += hourlyRevenue[hour];
        return { hour, revenue: cumulativeRevenue };
      });

      setFloorUsage(Object.keys(floorCount).map((key) => ({ name: key, value: floorCount[key] })));
      setHourlyRevenueData(cumulativeRevenueData);
    };

    fetchParkingLogs();
  }, [user, db, parkingPay]);

  const handleCardClick = (cardType) => {
    if (cardType === 'occupied') {
      navigate('/OperatorDashboard', { state: { activeCard: 'occupied' } });
    } else if (cardType === 'reserve') {
      navigate('/OperatorDashboard', { state: { activeCard: 'reserve' } });
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
    <div className="gradient-custom-2" style={{ backgroundColor: "white" }}>
        <div className="container">

          <a className="navbar-brand" style={{ padding: 20 }}></a>
        </div>
      <MDBContainer className="py-4">
        <MDBRow>
          <MDBCol lg="6">
            <OperatorReserve />
          </MDBCol>
          
          <MDBCol lg="11">
          <div className="summary-cards">
              {/* Merge your existing cards */}
              <Tab.Container id="parking-tab" defaultActiveKey="total">
           <Row className="mb-22">
            
  <Col>
    <Nav variant="pills" className="nav-tabs justify-content-start custom-nav-tabs">
      <Nav.Item>
        <Nav.Link
          eventKey="total"
          className="custom-tab"
        >
          Total Parking Spaces
        </Nav.Link>
      </Nav.Item>
      <div style={dividerStyle}></div> {/* Divider */}
      <Nav.Item>
        <Nav.Link
          eventKey="available"
          className="custom-tab"
        >
          Available Parking Spaces
        </Nav.Link>
      </Nav.Item>
      <div style={dividerStyle}></div> {/* Divider */}
      <Nav.Item>
                     
        <Nav.Link
          eventKey="fee"
          className="custom-tab"
        >
          Parking Fee
        </Nav.Link>
        
      </Nav.Item>
      <div style={dividerStyle}></div> {/* Divider */}

      <Nav.Item className="dropdown">
                        <a className="nav-link custom-tab dropdown-toggle" data-bs-toggle="dropdown" role="button" aria-expanded="false">
                          More
                        </a>
                        <ul className="dropdown-menu">
                          <li>
                            <button className="dropdown-item" onClick={() => handleNavigation('occupied')}>
                              Occupied Spaces
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => handleNavigation('reserved')}>
                            Occupied by Reservation
                            </button>
                          </li>
                        </ul>
                      </Nav.Item>
    </Nav>
  </Col>
</Row>
<Row>
  <Col>
    <Tab.Content>
      <Tab.Pane eventKey="total">
        <div style={{ padding: "20px" }}>
        <img
            src="totalPark.png"
            alt="Total Parking"
            className="card-images"
            style={{
              height: "50px",
              display: "block",
              margin: "auto",
            }}
          />
          <h4>Total Parking Spaces</h4>
          <p>{totalSlots} Total Parking Spaces</p>
        </div>
        
      </Tab.Pane>
    
      <Tab.Pane eventKey="available">
        <div style={{ padding: "20px", textAlign: "center" }}>
          <img
            src="available.png"
            alt="Available Spaces"
            className="card-images"
            style={{
              height: "50px",
              display: "block",
              margin: "auto",
              
            }}
          />
          <h4>Available Spaces</h4>
          <p>{availableSlots} Available Spaces</p>
        </div>
      </Tab.Pane>

      <Tab.Pane eventKey="fee">
        <div style={{ padding: "20px" }}>
        <img
            src="pesosign.png"
            alt="Available Spaces"
            className="card-images"
            style={{
              height: "50px",
              display: "block",
              margin: "auto",
            }}
          />
          <h4>Parking Fee</h4>
          <p>{parkingPay}</p>
        </div>
      </Tab.Pane>
    </Tab.Content>
  </Col>
</Row>
      </Tab.Container>
            </div>
          </MDBCol>
          <div className="duration">Establishment Reservation Duration: {reservationDuration} minutes</div>
        </MDBRow>
      </MDBContainer>
      <hr/>
      <div style={chartContainerStyle}>
    <div style={chartCardStyle}>
        <h5>Current Occupancy Rate</h5>
        <h6>{occupancyRate}%</h6>
        <ResponsiveContainer width={420} height={300}>  
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
        <ResponsiveContainer width={430} height={300}>  
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
    
  );
}

export default Home;

