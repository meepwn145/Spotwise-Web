import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import './DashboardOp.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import UserContext from '../UserContext';
import AddVehicleForm from './AddVehicleForm';
import { loginUser } from "../components/auth"; 

function DashboardOp() {
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [summaryCardsData, setSummaryCardsData] = useState([]);
    const [parkingSeeker, setParkingSeeker] = useState([]);
    const [agent, setAgent] = useState([]);
    const [activeCard, setActiveCard] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [userFound, setUserFound] = useState(true);
    const [userDetails, setUserDetails] = useState({});
    const [userPlateNumber, setUserPlateNumber] = useState("");
    const { user } = useContext(UserContext);
    const [errorMessage, setErrorMessage] = useState("");
    const [slotSets, setSlotSets] = useState([]);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [totalParkingSpaces, setTotalParkingSpaces] = useState(0);
    const [floorOptions, setFloorOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedFloorSlots, setSelectedFloorSlots] = useState([]);
    const [token, setToken] = useState('');

    const saveSlotsToLocalStorage = (slots) => {
        localStorage.setItem('slots', JSON.stringify(slots));
    };
    
    // Retrieve slots from local storage if available, or initialize as empty array
    const savedSlots = JSON.parse(localStorage.getItem('slots')) || [];
    
    // Use savedSlots in your code
    if (savedSlots.length > 0) {
        setSlotSets(savedSlots);
        console.log('Loaded slots from local storage:', savedSlots);
    }
   
    const fetchSlotData = async (managementName, setSlotSets) => {
        if (!managementName) {
            console.error('Management name is missing.');
            return;
        }
    
        try {
            const floorsRef = collection(db, 'spaces', managementName, 'floors');
            const floorsSnapshot = await getDocs(floorsRef);
    
            const allSlotSets = [];
    
            for (const floorDoc of floorsSnapshot.docs) {
                const floorTitle = floorDoc.id;
                const slotsRef = collection(db, 'spaces', managementName, 'floors', floorTitle, 'slots');
                const slotsSnapshot = await getDocs(slotsRef);
    
                const slots = slotsSnapshot.docs.map((slotDoc) => {
                    const slotData = slotDoc.data();
                    const slotId = slotData.slotId || parseInt(slotDoc.id.split(' ')[1], 10);
    
                    return {
                        id: slotId,
                        occupied: slotData.occupied || false,
                        userDetails: slotData.userDetails || {},
                    };
                });
    
                allSlotSets.push({
                    title: floorTitle,
                    slots,
                });
            }
    
            setSlotSets(allSlotSets);
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };
    
   useEffect(() => {
    if (user && user.managementName) {
        fetchSlotData(user.managementName, setSlotSets);
    }
}, [user]);
    
    
    const fetchTotalParkingSpaces = async () => {
        if (user && user.managementName) {
            const establishmentsRef = collection(db, "establishments");
            const q = query(establishmentsRef, where("managementName", "==", user.managementName));
            const querySnapshot = await getDocs(q);
            let totalSpaces = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                console.log("Establishment data:", data); // Debugging line
                if (data.totalSlots) {
                    console.log("Slots before parsing:", data.totalSlots); // Check the raw value
                    totalSpaces += parseInt(data.totalSlots, 10);
                    console.log("Current total after adding:", totalSpaces); // Check the cumulative total
                }
            });
            console.log("Computed total spaces:", totalSpaces); // Debugging line
            setTotalParkingSpaces(totalSpaces);
        } else {
            console.log("User or managementName not set"); // Debug if user or managementName is not available
        }
    };
    
    useEffect(() => {
        fetchTotalParkingSpaces();
    }, [user]);
    
    useEffect(() => {
        console.log("Total parking spaces updated in UI:", totalParkingSpaces);
    }, [totalParkingSpaces]);
    const fetchFloors = async () => {
        if (user && user.managementName) {
            const establishmentsRef = collection(db, "establishments");
            const q = query(establishmentsRef, where("managementName", "==", user.managementName));
            const querySnapshot = await getDocs(q);
            let allFloors = [];
            let totalSlots = 0;
    
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.floorDetails) {
                    data.floorDetails.forEach(floorDetail => {
                        const parkingLots = parseInt(floorDetail.parkingLots, 10);
                        if (!isNaN(parkingLots) && parkingLots > 0) {
                            allFloors.push({
                                ...floorDetail,
                                slots: new Array(parkingLots).fill({ occupied: false })
                            });
                        } else {
                            console.error('Invalid parking lots number:', floorDetail.parkingLots);
                        }
                    });
                }
            });
            console.log("Fetched Floors:", allFloors);
            setFloorOptions(allFloors);
            setTotalParkingSpaces(totalSlots);
        }
    };
    useEffect(() => {
        fetchFloors();
    }, [user]);

  
    const fetchFloorSlots = async (floorName) => {
        if (user && user.managementName) {
            const slotsRef = collection(db, 'spaces', user.managementName, 'floors', floorName, 'slots');
            const slotsSnapshot = await getDocs(slotsRef);
    
            // Retrieve the floor's total number of slots
            const floorOption = floorOptions.find(floor => floor.floorName === floorName);
            const totalSlots = floorOption ? parseInt(floorOption.parkingLots, 10) : slotsSnapshot.size;
    
            // Initialize all slots assuming they are unoccupied
            const allSlots = new Array(totalSlots).fill(null).map((_, index) => ({
                id: `Slot ${index + 1}`,
                occupied: false,
                userDetails: {}
            }));
    
            // Update the slot data from Firebase documents
            slotsSnapshot.docs.forEach((slotDoc) => {
                const slotData = slotDoc.data();
                const slotNumber = parseInt(slotDoc.id.split(' ')[1], 10);
    
                // Ensure valid slot number indexing
                if (slotNumber >= 1 && slotNumber <= totalSlots) {
                    const slotIndex = slotNumber - 1;
    
                    // Update the corresponding slot with its data from Firebase
                    allSlots[slotIndex] = {
                        id: `Slot ${slotNumber}`,
                        occupied: slotData.occupied || false,
                        userDetails: slotData.userDetails || {}
                    };
                }
            });
    
            console.log('Fetching slots for floor:', floorName);
            console.log('Available Floor Options:', floorOptions);
            // Log for debugging purposes
            console.log(`Occupied Slots for Floor "${floorName.trim () === ""}":`, allSlots);
           
            // Update the state to reflect the correctly fetched slots
            setSelectedFloorSlots(allSlots);
        }
    };
    
    
    
    useEffect(() => {
        console.log("Slot Sets Updated:", slotSets);
    }, [slotSets]);

    useEffect(() => {
        const initializedSlots = floorOptions.map(floor => ({
            ...floor,
            slots: new Array(parseInt(floor.parkingLots, 10)).fill({occupied: false})
        }));
        setSlotSets(initializedSlots);
        console.log("Initialized slot sets:", initializedSlots);
    }, [floorOptions]);
    
    useEffect(() => {
        fetchFloors();
    }, [user]); // Refetch when the user object changes
    

    const handleAddToSlot = async (carPlateNumber, slotIndex, currentSetIndex) => {
        console.log("Attempting to add to slot:", { carPlateNumber, slotIndex, currentSetIndex });
        
    
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
    
        if (!slotSets.length || currentSetIndex < 0 || currentSetIndex >= slotSets.length) {
            console.error("Invalid slot set selected.");
            return;
        }
    
        if (currentSetIndex < 0 || currentSetIndex >= slotSets.length) {
            setErrorMessage("Invalid slot set selected.");
            return;
        }
    
        const floor = slotSets[currentSetIndex];
        if (!floor || slotIndex < 0 || slotIndex >= floor.slots.length) {
            console.error(`Slot index ${slotIndex} is out of bounds.`);
            return;
        }
    
        const floorTitle = floor.floorName || "General Parking"; 
        console.log("Saving slot for floor:", floorTitle);
    
        const slotId = slotIndex + 1;  // Normalize the slotId
        const timeIn = new Date().toISOString();
        const timestamp = new Date();
        const uniqueSlotId = `${floorTitle} ${slotId}`; 
    
        const updatedSlot = {
            occupied: true,
            timestamp: new Date().toISOString(),
            userDetails: {
                agent: `${user.firstName || ''} ${user.lastName || ''}`,
                carPlateNumber,
                contactNumber: userDetails.contactNumber || '',
                email: userDetails.email || '',
                floorTitle, 
                slotId,
                timeIn
            }
        };

        const updatedSlots = [...floor.slots];
        updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], ...updatedSlot, occupied: true, carPlateNumber};
    
        const updatedFloor = { ...floor, slots: updatedSlots };
        const updatedSlotSets = [...slotSets];
        updatedSlotSets[currentSetIndex] = updatedFloor;
        setSlotSets(updatedSlotSets);
        try {
            const slotDocRef = doc(db, 'spaces', user.managementName, 'floors', floorTitle , 'slots' , uniqueSlotId);
            await setDoc(slotDocRef, updatedSlot, { merge: true });
            console.log(`Slot ${slotId} on ${floorTitle} Floor is occupied`);
            setErrorMessage("");
        } catch (error) {
            console.error("Failed to update slot in Firebase:", error);
            setErrorMessage("Failed to update slot in Firebase.");
        }
    };
    
    useEffect(() => {
        console.log("Floor options updated:", floorOptions);
        if (floorOptions.length > 0) {
            setSelectedFloor(floorOptions[0].floorName); // Set default selected floor
            console.log("Initial floor set to:", floorOptions[0].floorName);
        }
    }, [floorOptions]);
    const handleFloorChange = (e) => {
        const floorName = e.target.value;
        setSelectedFloor(floorName);
        fetchFloorSlots(floorName);
        
        // Find the slots for the selected floor
        const selectedFloor = floorOptions.find(floor => floor.floorName === floorName);
        if (selectedFloor) {
            setSelectedFloorSlots(selectedFloor.slots);
        } else {
            setSelectedFloorSlots([]);
        }
    
        console.log("Selected floor:", floorName);
        console.log("Slots for selected floor:", selectedFloorSlots);
    };
    

    const renderSelectedFloorSlots = () => {
        if (!selectedFloor || selectedFloorSlots.length === 0) {
            return <p>No slots available for the selected floor.</p>;
        }
    
        return (
            <div className="slots-container">
                {selectedFloorSlots.map((slot, index) => {
                    // Extract slot data and apply occupied status correctly
                    const isOccupied = slot.occupied;
                    const slotNumber = index + 1; // Ensure consistent numbering with the backend
    
                    // Assign the appropriate background color and slot label
                    const slotLabel = isOccupied ? (slot.userDetails?.carPlateNumber || `Slot ${slotNumber}`) : `Slot ${slotNumber}`;
                    const backgroundColor = isOccupied ? 'red' : 'green';
    
                    return (
                        <div
                            key={index}
                            className={`slot ${isOccupied ? 'occupied' : 'available'}`}
                            style={{
                                width: '90px',
                                height: '80px',
                                backgroundColor,
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                margin: '10px',
                            }}
                        >
                            {slotLabel}
                        </div>
                    );
                })}
            </div>
        );
    };

    
    
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

    useEffect(() => {
        const fetchParkingUsers = async () => {
            const querySnapshot = await getDocs(collection(db, "user"));
            setParkingSeeker(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
    }, []);
    useEffect(() => {
        setSummaryCardsData([
            { 
                title: 'Enter Vehicle', 
                imgSrc: 'addV.png', 
                cardType: 'agents' 
            }
        ]);
    }, [agent]);  // Add any other dependencies if needed
    

    const handleCardClick = (cardType) => {
        console.log(`Card clicked: ${cardType}`);
        setActiveCard(activeCard === cardType ? '' : cardType);
    };

    
    const renderFormBasedOnCardType = () => {
        let data = [];
        let headers = [];
        switch (activeCard) {
            case 'agents':
                return <AddVehicleForm onSearch={searchInFirebase} floorOptions={floorOptions || []} handleAddToSlot={handleAddToSlot} />;
            default:
                return null;
        }
        return (
            <div style={{ 
                overflowY: 'auto', 
                maxHeight: '50%', 
                maxWidth: '90%', 
                justifyContent: 'center', 
                margin: 'auto', 
                borderRadius: '2%', 
                borderRadius: 10,
                borderStyle: 'solid', // Set border style to solid
                borderColor: '#39FF14',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Box shadow for depth
               
                // Custom scrollbar design
              // Set the width of the scrollbar
            
              scrollbarColor: '#39FF14 #f8f9fa', // Set the color of the scrollbar thumb and track
                WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
                '&::-webkit-scrollbar': {
                    width: '20px', // Set the width of the scrollbar
                    height: '20px', // Set the height of the scrollbar
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#98FB98', // Set the color of the scrollbar thumb
                    borderRadius: '15px', // Set a larger border radius for a softer appearance
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa', // Set the color of the scrollbar track
                    borderRadius: '15px', // Set a larger border radius for a softer appearance
                },
            }}>
                <section className="intro">
                    <div className="bg-image h-100" style={{ backgroundColor: '#132B4B' }}>
                        <div className="mask d-flex align-items-center h-100">
                            <div className="container">
                                <div className="row justify-content-center">
                                    <div className="col-12">
                                        <div >
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-borderless mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th cope="col" style={{ width: '10%', padding: '10px'}}>
                                                                    <div className="form-check" >
                                                                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                                    </div>
                                                                </th>
                                                                {headers.map((header, index) => (
                                                                    <th scope="col" key={index}>{header.toUpperCase()}</th>
                                                                ))}
                                                                <th scope="col">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.map((item, index) => (
                                                                <tr key={index}>
                                                                    <th scope="row">
                                                                        <div className="form-check">
                                                                            <input className="form-check-input" type="checkbox" value="" id={`flexCheckDefault${index}`} checked={item.checked} />
                                                                        </div>
                                                                    </th>
                                                                    {headers.map((header, subIndex) => (
                                                                        <td key={`${index}-${subIndex}`}>{item[header.toLowerCase().replace(/ /g, '')]}</td>
                                                                    ))}
                                                                    <td>
                                                                        <button type="button" className="btn btn-danger btn-sm px-3" onClick={() => handleDecline(item.id)}>
                                                                            <i className="fas fa-times">X</i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            
                    );
                };
            const handleApprove = async (accountId) => {
                const accountRef = doc(db, "pendingEstablishments", accountId);
                const accountSnapshot = await getDoc(accountRef);
                const accountData = accountSnapshot.data();
              
            
                await setDoc(doc(db, "establishments", accountId), {
                  ...accountData,
                  createdAt: new Date(),
                  isApproved: true
                });
              
                await deleteDoc(accountRef);
              
                setPendingAccounts(pendingAccounts.filter(account => account.id !== accountId));
              };
        
              const handleDecline = async (accountId) => {
              }
              
              return (
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
                    <li><a href="DashboardOp"><i class="fas fa-home"></i>Home</a></li>
                    <li><a href='Reservation'><i class="fas fa-user"></i>Manage Reservation</a></li>
                    <li><a href='OperatorDashboard'><i class="fas fa-address-card"></i>Records</a></li>
                    <li><a href="OperatorProfile"><i class="fas fa-blog"></i>Profile</a></li>
                    <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
                </ul> 
            </div>
            </div>
              </div>
              <div className="main-content">
                        <div className="summary-cards">
                            {summaryCardsData.map(card => (
                                <div key={card.title} className={`card card-${card.cardType}`} onClick={() => handleCardClick(card.cardType)}>
                                    <img src={card.imgSrc} alt={card.title} className="card-image" />
                                    <div className="card-content">
                                        <div className="card-title">{card.title}</div>
                                        <div className="card-value">{card.value}</div>
                                    </div>    
                                </div>
                            ))}
                        </div>
                        <div className="container">
                        <h1>Please select floors</h1>
                    <select value={selectedFloor} onChange={handleFloorChange} className="floor-select">
                        <option value="">Select Floor</option>
                        {floorOptions.map((floor, index) => (
                            <option key={index} value={floor.floorName}>{floor.floorName}</option>
                        ))}
                    </select>
                    <hr className="divider" />
                        {renderSelectedFloorSlots()}
                        {renderFormBasedOnCardType()}
                    </div>
              </div>
            </div>       
            </div>
            );
        }
        
        export default DashboardOp;

    