import { useState, useEffect, useContext } from 'react';
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
  const [agentFirst, setAgentFirstName] = useState(user.firstName || "");
  const [agentLastName, setAgentLastName] = useState(user.lastName || "");
  const agentFullName = `${agentFirst} ${agentLastName}`;
  const [data, setData] = useState([]);
  const [activeCard, setActiveCard] = useState('');
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
  const location = useLocation();

  const styles = {
  };

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
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#132B4B" }}>
        <div className="container">
          <a className="navbar-brand" style={{ padding: 20 }}>
          </a>
        </div>
      </nav>
      <MDBContainer className="py-4">
        <MDBRow>
          <MDBCol lg="4">
            <OperatorReserve />
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
  );
}

export default OperatorDashboard;
