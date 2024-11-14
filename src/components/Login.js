import React, { useState, useContext, useEffect } from "react";
import { db, auth } from "../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import UserContext from "../UserContext";
import { Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { loginUser } from "./auth"; 

import { Dropdown } from "bootstrap";

function Login() {
	const { setUser } = useContext(UserContext);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [establishmentData, setEstablishmentData] = useState(null);
	const navigate = useNavigate();
	const [userType, setUserType] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [pendingAccounts, setPendingAccounts] = useState([]);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};
	const passwordToggleStyle = {
		position: "absolute",
		right: "10px",
		top: "40%",
		transform: "translateY(-50%)",
		cursor: "pointer",
		userSelect: "none",
	};

	const handleCreate = () => {
		navigate("/Create");
	};

	useEffect(() => {
		const fetchPendingAccounts = async () => {
			const q = query(collection(db, "pendingEstablishments"));
			const querySnapshot = await getDocs(q);
			const accounts = [];
			querySnapshot.forEach((doc) => {
				accounts.push({ id: doc.id, ...doc.data() });
			});
			setPendingAccounts(accounts);
		};

		fetchPendingAccounts();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
	
		try {
			// Check if email is in pending
			const inPending = pendingAccounts.some((user) => user.email === email);
			if (inPending) {
				alert("Account still awaiting admin approval!");
				return;
			}
	
			// Attempt to log in and retrieve the token
			const { user, token } = await loginUser(email, password);
			console.log("Access Token:", token);  // Token is logged here and can be used as needed
	
			if (user) {
				const agentsRef = query(collection(db, "agents"), where("email", "==", user.email));
				const establishmentsRef = query(
					collection(db, "establishments"),
					where("email", "==", user.email)
				);
	
				const [agentsSnapshot, establishmentsSnapshot] = await Promise.all([
					getDocs(agentsRef),
					getDocs(establishmentsRef),
				]);
	
				let userData = null;
				let path = "";
	
				if (!agentsSnapshot.empty) {
					userData = agentsSnapshot.docs[0].data();
					path = "/Home";
				} else if (!establishmentsSnapshot.empty) {
					userData = establishmentsSnapshot.docs[0].data();
					path = "/Dashboard";
				}
	
				if (userData) {
					setUser({...userData, token}); // Set user data along with token in the context
					navigate(path);
					alert("Login successful!");
				} else {
					alert("User not found. Please try again.");
				}
			} else {
				alert("Authentication failed");
			}
		} catch (error) {
			console.error("Error logging in:", error);
			alert("Error logging in: " + error.message);
		}
	};
	const containerStyle = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		minHeight: "100vh",
		backgroundColor: "white",
		position: "relative",
		width: "100%",
		height: "150%",
	};

	const selectStyle = {
		width: "100%",
		padding: "10px",
		marginBottom: "15px",
		border: "1px solid #ccc",
		borderRadius: "5px",
		fontSize: "16px",
		fontFamily: "Georgina",
	};
	const formContainerStyle = {
		display: "flex",
		alignItems: "center",
		backgroundColor: "white",
		marginTop: "50px",
		padding: "30px",
		borderRadius: "50px",
		width: "900px",
		boxShadow: "0 4px 16px 0 rgba(0,0,0,0.5)",
		zIndex: 2,
	};
	const formStyle = {
		width: "50%",
		marginLeft: 50,
	};
	const imageContainerStyle = {
		width: "50%",
		marginLeft: 50,
		borderRadius: "10px",
	};

	const inputStyle = {
		width: "100%",
		padding: "10px",
		marginBottom: "15px",
		border: "1px solid #ccc",
		borderRadius: "5px",
		fontSize: "16px",
		fontFamily: "Georgina",
		borderRadius: "100px",
	};

	const buttonStyle = {
		width: "100%",
		padding: "12px",
		color: "white",
		border: "none",
		borderRadius: "5px",
		cursor: "pointer",
		fontSize: "18px",
		backgroundColor: "#4d659d",
		fontFamily: "Helvetica",
		borderRadius: "100px",
	};

	const buttonStyle2 = {
		width: "100%",
		padding: "12px",
		marginTop: "25px",
		backgroundColor: "#536daa",
		color: "white",
		border: "none",
		borderRadius: "5px",
		cursor: "pointer",
		fontSize: "18px",
		fontFamily: "Helvetica",
		borderRadius: "100px",
	};
	const backgroundImage = {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	};
	const navbarStyle = {
		display: "flex",

		justifyContent: "space-between",
		alignItems: "center",
		padding: "15px",
		backgroundColor: " #132B4B",
		color: "white",
		width: "100%",
	};

	const logoStyle = {
		fontSize: "24px",
		fontWeight: "bold",
	};
	const imageStyle = {
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		width: "50%",
		height: "100%",
		objectFit: "absolute",
		zIndex: -1,
	};
	const separtor = {
		display: "flex",
		alignItems: "center",
		color: "#808080",
		marginTop: 10,
		marginBottom: 10,
	};
	const line = {
		flex: 1,
		height: 1,
		backgroundColor: "#FFD700",
		marginBottom: 30,
	};
	const logoContainer = {
		flexDirection: "row", // Arrange the logos side by side
		justifyContent: "space-around",
		marginBottom: 10,
		marginTop: 10,
	};
	const logo = {
		width: 50,
		height: 50,
		marginRight: 30,
		resizeMode: "contain",
	};
	const logo2 = {
		width: 50,
		height: 50,
		resizeMode: "contain",
		marginRight: 30,
	};
	const logo3 = {
		width: 50,
		height: 50,
		resizeMode: "contain",
	};

	return (
		<div style={containerStyle}>
			<div style={navbarStyle}>
				<img src="wingsMoto1.png" alt="Wings Moto" style={imageStyle} />
				<Link
					className="navbar-brand"
					style={{ fontSize: "25px", marginLeft: "100px", fontFamily: "Helvetica", color: "white" }}
				>
					Spotwise
				</Link>
			</div>
			<div style={formContainerStyle}>
				<div style={formStyle}>
					<h1 style={{ marginBottom: "50px", fontFamily: "Helvetica", textAlign: "center" }}>
						Sign in
					</h1>
					<form onSubmit={handleSubmit}>
						<div>
							<input
								type="text"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								style={inputStyle}
							/>
						</div>
						<div style={{ position: "relative" }}>
							<input
								type={showPassword ? "text" : "password"}
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								style={inputStyle}
							/>
							{password.length > 0 && (
								<span style={passwordToggleStyle} onClick={togglePasswordVisibility}>
									{showPassword ? (
										<FontAwesomeIcon icon={faEyeSlash} />
									) : (
										<FontAwesomeIcon icon={faEye} />
									)}
								</span>
							)}
						</div>
						<button type="submit" style={buttonStyle}>
							Log In
						</button>
						<button type="submit" style={buttonStyle2} onClick={handleCreate}>
							Create Account
						</button>
						<p style={{ marginTop: "20px", fontSize: "14px" }}>
							<a href="/forget">Forgot Password?</a>
						</p>
						<div style={separtor}></div>
						
					</form>
				</div>
				<div style={imageContainerStyle}>
					<img
						src="logoP.png"
						alt="Logo"
						style={{ width: "100%", height: "auto", borderRadius: "10px" }}
					/>
				</div>
			</div>
		</div>
	);
}
export default Login;
