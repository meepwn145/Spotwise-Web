import { useState, useEffect, useContext } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaUserCircle, FaCar, FaParking, FaRegListAlt } from "react-icons/fa";
import { faCar, faCoins, faUser, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { db } from "../config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import UserContext from '../UserContext';
import OperatorReserve from './operatorReserve';

import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBCard,
  MDBCardText,
  MDBCardBody,
  MDBCardImage,
  MDBBtn,
  MDBTypography,
} from 'mdb-react-ui-kit';

function OperatorDashboard() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('occupied'); // Default to "Occupied Spaces"
  const [agentFirst, setAgentFirstName] = useState(user.firstName || "");
  const [agentLastName, setAgentLastName] = useState(user.lastName || "");
  const agentFullName = `${agentFirst} ${agentLastName}`;
  const [data, setData] = useState([]);
  const location = useLocation();
  const [activeCard, setActiveCard] = useState(location.state?.activeCard || 'occupied'); // Default to 'occupied'
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [parkingSeeker, setParkingSeeker] = useState([]);
  const [summaryCardsData, setSummaryCardsData] = useState([]);
  const [agent, setAgent] = useState([]);    
  const [totalParkingSpaces, setTotalParkingSpaces] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [occupiedSpaces, setOccupiedSpaces] = useState(0);
  const [parkingPay, setParkingPay] = useState(0);
  const [numberOfParkingLots, setNumberOfParkingLots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0); 
  const [parkingLogs, setParkingLogs] = useState([]);
  const [reserveLogs, setReserveLogs] = useState([]);
  const [availableLogs, setAvailableLogs] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [reservedSpaces, setReservedSpaces] = useState(0);
  const totalRevenues = totalUsers * parkingPay;
  const navigate = useNavigate();

  const styles = {
  };
  const tabStyles = {
    tabContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      cursor: 'pointer',
      border: '1px solid #ddd',
      borderRadius: '5px',
      padding: '10px 20px',
      margin: '0 5px',
      transition: 'all 0.3s ease',
    },
    activeTab: {
      backgroundColor: '#007bff',
      color: '#fff',
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    inactiveTab: {
      backgroundColor: '#f8f9fa',
      color: '#007bff',
    },
    icon: {
      width: '20px',
      height: '20px',
      marginRight: '10px',
    },
  };
  useEffect(() => {
    if (location.state?.activeCard) {
      setActiveTab(location.state.activeCard);
    }
  }, [location.state]);
  
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

  // Combined function to update both occupied and reserved slots
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
    setActiveCard(activeCard === cardType ? '' : cardType);
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
                    <td>
                    {log.from === 'Reservation' ? log.from : log.status}
                    </td>
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
                    <td>
                      {log.from}
                    </td>
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
  
  

  return (
    <div className="gradient-custom-2" style={{ backgroundColor: 'white' }}>
      <div className="container">
        <a className="navbar-brand" style={{ padding: 20 }}></a>
      </div>
      <MDBContainer className="py-4">
        <MDBRow>
          <MDBCol lg="4">
            <OperatorReserve />
          </MDBCol>
          <MDBCol lg="8">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
  {['occupied', 'reserved'].map((tab) => (
    <div
      key={tab}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: 'pointer',
        border: activeTab === tab ? '2px solid #0056b3' : '1px solid #ccc',
        borderRadius: '8px',
        padding: '12px 24px',
        margin: '0 10px',
        transition: 'all 0.3s ease',
        backgroundColor: activeTab === tab ? '#0056b3' : '#f0f0f0',
        color: activeTab === tab ? '#fff' : '#0056b3',
        boxShadow: activeTab === tab ? '0 6px 12px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontSize: '16px',
        fontWeight: '500',
      }}
      onClick={() => setActiveTab(tab)}
      onMouseEnter={(e) => {
        if (activeTab !== tab) e.currentTarget.style.backgroundColor = '#e6f2ff';
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) e.currentTarget.style.backgroundColor = '#f0f0f0';
      }}
    >
      <img
        src={tab === 'occupied' ? 'occupied.png' : 'reservedP.png'}
        alt={tab.charAt(0).toUpperCase() + tab.slice(1)}
        style={{ width: 30, height: 30, borderRadius: '50%' }}
      />
      <span>{tab === 'occupied' ? 'Occupied Spaces' : 'Reserved Spaces'}</span>
    </div>
  ))}
</div>
  
            {activeTab === 'occupied' && (
              <div>
                <h3>Occupied Spaces</h3>
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
            )}
  
            {activeTab === 'reserved' && (
              <div>
                <h3>Reserved Spaces</h3>
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
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}

export default OperatorDashboard;
