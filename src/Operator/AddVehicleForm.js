import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import './DashboardOp.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import UserContext from '../UserContext';

function AddVehicleForm({ onSearch, floorOptions, handleAddToSlot }) {
    const [plateNumber, setPlateNumber] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [slotOptions, setSlotOptions] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    
    useEffect(() => {
        const newIndex = floorOptions.findIndex(f => f.floorName === selectedFloor);
        console.log(`Updating currentSetIndex: ${newIndex} for floor: ${selectedFloor}`);
        setCurrentSetIndex(newIndex);
    }, [selectedFloor, floorOptions]);
    useEffect(() => {
        console.log("Floor options updated:", floorOptions);
        if (floorOptions.length > 0) {
            setSelectedFloor(floorOptions[0].floorName); // Set default selected floor
            console.log("Initial floor set to:", floorOptions[0].floorName);
        }
    }, [floorOptions]);

    useEffect(() => {
        if (selectedFloor) {
            const floor = floorOptions.find(f => f.floorName === selectedFloor);
            if (floor && !isNaN(parseInt(floor.parkingLots, 10))) {
                const slots = Array.from({ length: parseInt(floor.parkingLots, 10) }, (_, i) => i + 1);
                setSlotOptions(slots);
            } else {
                console.log("Invalid or missing data for floor:", selectedFloor);
                setSlotOptions([]);
            }
        }
    }, [selectedFloor, floorOptions]);
    

    console.log("Selected floor at slot assignment:", selectedFloor);

    const handleSearch = () => {
        if (plateNumber) {
            onSearch(plateNumber);
        } else {
            alert("Please enter a plate number to search.");
        }
    };

    const handleFloorChange = (e) => {
        setSelectedFloor(e.target.value);
        console.log("Selected floor updated to:", e.target.value); // This will log the selected floor to the console
    };
    

    const handleSlotSelection = (e) => {
        setSelectedSlot(e.target.value);
    };

    const handleSubmit = () => {
        if (!plateNumber) {
            alert("Please enter a plate number to search.");
            return;
        }
        let slotIndex = parseInt(selectedSlot) - 1; // Convert to zero-based index
        if (slotIndex < 0 || slotIndex >= slotOptions.length) {
            alert("Please select a valid slot.");
            return;
        }
        handleAddToSlot(plateNumber, slotIndex, currentSetIndex);
    };

    return (
        <Form style={{ 
            border: '1px solid #ccc', // Add a border around the form
            padding: '20px', // Add some padding to the form
            borderRadius: '5px', // Add border radius for a softer appearance
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add a box shadow for depth
            margin: 10
        }}>
            <Row className="mb-3">
                <Form.Group as={Col} controlId="formGridEmail">
                    <Form.Control type="email" placeholder="Enter email" />
                </Form.Group>
                <Form.Group as={Col} controlId="formGridPlateNumber">
                    <Form.Control
                        type="text"
                        placeholder="Plate Number"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                    />
                </Form.Group>
            </Row>
            <Form.Group className="mb-3" controlId="formGridContactNumber">
                <Form.Control placeholder="Contact Number" />
            </Form.Group>
            <Row className="mb-3">
                <Form.Group as={Col} controlId="formGridTimeIn">
                    <Form.Control placeholder="Time In" />
                </Form.Group>
                <Form.Group as={Col} controlId="formGridFloor">
                    <Form.Select defaultValue="Choose..." onChange={handleFloorChange}>
                        <option>Choose...</option>
                        {floorOptions.map((floor, index) => (
                            <option key={index} value={floor.floorName}>{floor.floorName}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group as={Col} controlId="formGridSlotNumber">
                    <Form.Select defaultValue="Select Slot" onChange={handleSlotSelection}>
                        <option value="">Select Slot...</option>
                        {slotOptions.map((slot, index) => (
                            <option key={index} value={slot}>{slot}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Row>
            <Button variant="primary" onClick={handleSubmit} style={{ backgroundColor: '#132B4B', color: '#fff', border: 'none', marginRight: '10px' }}>Assign Slot</Button>
            <Button variant="secondary" onClick={handleSearch}>Search</Button> 
        </Form>
            );
        }
        export default AddVehicleForm;