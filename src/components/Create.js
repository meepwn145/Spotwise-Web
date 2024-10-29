import React, { useState, useEffect } from "react";
import { db, auth } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Alert } from "react-bootstrap";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from "react-places-autocomplete";
import { useGeolocated } from "react-geolocated";
import * as geofire from "geofire-common";

function Create() {
	const [managementName, setManagementName] = useState("");
	const [companyAddress, setAddress] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [numberOfParkingLots, setNumberOfParkingLots] = useState("1");
	const [parkingPay, setParkingPayment] = useState("");
	const [contact, setContact] = useState("");
	const [isApproved, setIsApproved] = useState(false);
	const [numberOfFloors, setNumberOfFloors] = useState(1);
	const [floorDetails, setFloorDetails] = useState([]);
	const [totalSlot, setTotalSlot] = useState("");
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
	const [geolocationAvailable, setGeolocationAvailable] = useState(true);
	const navigate = useNavigate();

	const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
		positionOptions: { enableHighAccuracy: false },
		userDecisionTimeout: 5000,
	});

	useEffect(() => {
		setGeolocationAvailable(isGeolocationAvailable);
		if (coords) {
			setCoordinates({ lat: coords.latitude, lng: coords.longitude });
		}
	}, [coords, isGeolocationAvailable]);

	useEffect(() => {
		setGeolocationAvailable(isGeolocationAvailable);
		if (coords) {
			setCoordinates({ lat: coords.latitude, lng: coords.longitude });
		}
	}, [coords, isGeolocationAvailable]);

	const handleNumberOfFloorsChange = (e) => {
		const value = e.target.value;
		setNumberOfFloors(value);

		if (value === "0") {
			setFloorDetails([]);
		} else if (value >= 2) {
			setFloorDetails(Array.from({ length: value }, () => ({ floorName: "", parkingLots: "" })));
		} else {
			setFloorDetails([]);
			setNumberOfParkingLots("");
		}
	};

	const handleFloorDetailsChange = (index, key, value) => {
		const updatedFloorDetails = floorDetails.map((detail, i) => {
			if (i === index) {
				return { ...detail, [key]: value };
			}
			return detail;
		});
		setFloorDetails(updatedFloorDetails);
	};

	const handleFileChange = (event) => {
		setSelectedFiles([...event.target.files]);
	};

	const handleAddressSelect = async (address) => {
		try {
			const results = await geocodeByAddress(address);
			const latLng = await getLatLng(results[0]);
			setCoordinates(latLng);
			setAddress(address); // Update selected address in the state
		} catch (error) {
			console.error("Error fetching address coordinates:", error);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!managementName || !companyAddress || !email || !password || !contact || !parkingPay) {
			alert("Please fill out all fields.");
			return;
		}

		if (!selectedFiles) {
			alert("Please upload a document.");
			return;
		}

		let totalSlots = 0;

		if (numberOfFloors == "1") {
			if (!numberOfParkingLots) {
				alert("Please enter the number of parking slots.");
				return;
			}
			totalSlots = parseInt(numberOfParkingLots, 10) || 0;
		} else {
			if (floorDetails.some((floor) => !floor.floorName || !floor.parkingLots)) {
				alert("Please fill out all floor details.");
				return;
			}

			totalSlots = floorDetails.reduce((acc, curr) => {
				return acc + (parseInt(curr.parkingLots, 10) || 0);
			}, 0);
		}

		try {
			const uploadPromises = selectedFiles.map((file) => {
				const fileRef = ref(storage, `documents/${email}/${file.name}`);
				return uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
			});

			const fileURLs = await Promise.all(uploadPromises);

			const hash = geofire.geohashForLocation([coordinates.lat, coordinates.lng]);

			const establishmentData = {
				email,
				companyAddress,
				contact,
				managementName,
				parkingPay,
				password,
				numberOfFloors: parseInt(numberOfFloors, 10),
				floorDetails,
				totalSlots,
				isApproved: false,
				fileURLs,
				coordinates: {
					lat: coordinates.lat,
					lng: coordinates.lng,
				},
				geohash: hash,
			};

			await addDoc(collection(db, "pendingEstablishments"), establishmentData);

			alert("We are currently processing your account. Please wait for admin approval. Thank you!");
			navigate("/");
		} catch (error) {
			console.error("Error creating account:", error);
			alert(error.message);
		}
	};

	const handleParkingTypeChange = (e) => {
		setNumberOfParkingLots(e.target.value);
	};

	const containerStyle = {
		display: "flex",
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-around",
		minHeight: "100vh",
		backgroundColor: "#e6e6fa",
		padding: "20px",
		gap: "10px",
	};

	const formContainerStyle = {
		backgroundColor: "#ffffff",
		padding: "40px",
		borderRadius: "15px",
		boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
		width: "450px",
		marginTop: "30px",
		width: "40%",
		minHeight: "500px",
	};

	const inputGroupStyle = {
		marginBottom: "20px",
	};

	const inputStyle = {
		width: "100%",
		padding: "12px",
		border: "1px solid #ddd",
		borderRadius: "8px",
		fontSize: "16px",
		color: "#333",
	};

	const buttonStyle = {
		width: "100%",
		padding: "15px",
		backgroundColor: "#32cd32",
		color: "white",
		border: "none",
		borderRadius: "8px",
		cursor: "pointer",
		fontSize: "18px",
		transition: "background-color 0.3s",
	};

	const navbarStyle = {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "20px",
		backgroundColor: "#333",
		color: "white",
		width: "100%",
	};

	const logoStyle = {
		fontSize: "24px",
		fontWeight: "bold",
	};

	const additionalContainerStyle = {
		backgroundColor: "#ffffff",
		padding: "30px",
		borderRadius: "15px",
		boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
		width: "450px",
		marginTop: "20px",
		marginBottom: "20px",
		width: "30%",
		minHeight: "500px",
	};

	const fileInputStyle = {
		width: "100%",
		padding: "12px",
		border: "1px solid #ddd",
		borderRadius: "8px",
		fontSize: "16px",
		color: "#333",
		marginBottom: "20px",
	};

	return (
		<div>
			<div style={navbarStyle}>
				<div style={logoStyle}>SpotWise Parking Management</div>
			</div>
			<div style={containerStyle}>
				<div style={formContainerStyle}>
					<h2 style={{ textAlign: "center", marginBottom: "20px", fontSize: "18px" }}>
						Create a New Account
					</h2>
					<form onSubmit={handleSubmit}>
						<div style={inputGroupStyle}>
							<input
								type="text"
								placeholder="Management Name"
								value={managementName}
								onChange={(e) => setManagementName(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
						<div style={inputGroupStyle}>
							<PlacesAutocomplete
								value={companyAddress}
								onChange={setAddress}
								onSelect={handleAddressSelect}
							>
								{({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
									<div>
										<input {...getInputProps({ placeholder: "Search Address ..." })} required />
										{loading && <div>Loading...</div>}
										{suggestions.map((suggestion) => (
											<div
												{...getSuggestionItemProps(suggestion, {
													style: {
														backgroundColor: suggestion.active ? "#fafafa" : "#ffffff",
														cursor: "pointer",
													},
												})}
											>
												<span>{suggestion.description}</span>
											</div>
										))}
									</div>
								)}
							</PlacesAutocomplete>
						</div>

						<div style={inputGroupStyle}>
							<input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
						<div style={inputGroupStyle}>
							<input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
						<div style={inputGroupStyle}>
							<input
								type="text"
								placeholder="Contact"
								value={contact}
								onChange={(e) => setContact(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
						<div style={inputGroupStyle}>
							<input
								type="text"
								placeholder="Parking Payment"
								value={parkingPay}
								onChange={(e) => setParkingPayment(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
						<div style={inputGroupStyle}>
							<label htmlFor="documentUpload">Please upload your BIR Document</label>
							<input
								type="file"
								id="documentUpload"
								onChange={handleFileChange}
								multiple
								style={fileInputStyle}
							/>
						</div>
						<button type="submit" style={buttonStyle}>
							Sign Up
						</button>
					</form>
				</div>
				<div style={additionalContainerStyle}>
					<div style={inputGroupStyle}>
						<label htmlFor="numberOfFloors">Number of Floors</label>
						<input
							type="number"
							id="numberOfFloors"
							min="1"
							value={numberOfFloors}
							onChange={handleNumberOfFloorsChange}
							style={inputStyle}
						/>
					</div>
					{numberOfFloors == "1" && (
						<div style={inputGroupStyle}>
							<label htmlFor="parkingSlots">Number of Parking Slots Available</label>
							<input
								type="number"
								id="parkingSlots"
								value={numberOfParkingLots}
								min="1"
								onChange={(e) => setNumberOfParkingLots(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
					)}
					{numberOfFloors >= 2 &&
						floorDetails.map((floor, index) => (
							<div key={index} style={inputGroupStyle}>
								<input
									type="text"
									placeholder={`Name for Floor ${index + 1}`}
									value={floor.floorName}
									onChange={(e) => handleFloorDetailsChange(index, "floorName", e.target.value)}
									style={inputStyle}
								/>
								<input
									type="number"
									placeholder={`Parking lots for Floor ${index + 1}`}
									value={floor.parkingLots}
									min="1"
									onChange={(e) => handleFloorDetailsChange(index, "parkingLots", e.target.value)}
									style={inputStyle}
								/>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}

export default Create;
