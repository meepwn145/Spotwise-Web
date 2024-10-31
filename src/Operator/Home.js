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
    const fetchEstablishmentData = async () => {
      try {
        const q = query(collection(db, "establishments"), where("managementName", "==", user.managementName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const establishmentData = querySnapshot.docs[0].data();
          setParkingPay(establishmentData.parkingPay);
          setTotalSlots(establishmentData.totalSlots);
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const handleCardClick = (cardType) => {
    if (cardType === 'occupied') {
      navigate('/OperatorDashboard', { state: { activeCard: 'occupied' } });
    } else if (cardType === 'reserve') {
      navigate('/OperatorDashboard', { state: { activeCard: 'reserve' } });
    }
  };
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
      <Nav.Item>
        <Nav.Link
          eventKey="available"
          className="custom-tab"
        >
          Available Parking Spaces
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          eventKey="fee"
          className="custom-tab"
        >
          Parking Fee
        </Nav.Link>
      </Nav.Item>
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
                            <button className="dropdown-item" onClick={() => handleNavigation('reserve')}>
                              Reserved Spaces
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
        </MDBRow>
      </MDBContainer>
      <hr className="divider" />
      <MDBContainer className="py-0">
        <MDBRow>
          <MDBCol lg="6">
            <div style={{ margin: "20px 0", textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>
              Floor Usage
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={floorUsage} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {floorUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </MDBCol>
          <MDBCol lg="6">
            <div style={{ margin: "20px 0", textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>
              Hourly Revenue
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyRevenueData}>
                <XAxis dataKey="hour" />
                <YAxis type="number" allowDataOverflow={true} tickCount={6} domain={[0, "dataMax"]} interval={0} tickFormatter={(tick) => tick.toFixed(0)} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}

export default Home;
