import React, { useState, useEffect } from "react";
import { db, auth } from "../config/firebase";
import {
	collection,
	query,
	where,
	getDocs,
	updateDoc,
	doc,
	getDoc,
	setDoc,
	deleteDoc,
	Timestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./AdminPage.css";
import { Link } from "react-router-dom";
import styled from "styled-components";
import AdminSide from './adminside';

function AdminPage() {
	const [pendingAccounts, setPendingAccounts] = useState([]);
	const [establishments, setEstablishments] = useState([]);
	const [summaryCardsData, setSummaryCardsData] = useState([]);
	const [parkingSeeker, setParkingSeeker] = useState([]);
	const [agent, setAgent] = useState([]);
	const MainContent = styled.div`
		margin: auto;
		margin-top: 10vh;
		padding: 20px;
		max-width: 1200px;
	`;

	const SummaryCards = styled.div`
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		justify-content: center;
		margin-bottom: 40px;
	`;

	const Card = styled.div`
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		width: 280px;
		text-align: center;
	`;

	const CardImage = styled.img`
		width: 100%;
		height: 150px;
		object-fit: cover;
	`;

	const CardContent = styled.div`
		padding: 20px;
	`;

	const CardTitle = styled.div`
		font-size: 1.2em;
		font-weight: bold;
		margin-bottom: 10px;
	`;

	const CardValue = styled.div`
		font-size: 1.5em;
		color: #555;
	`;

	const ProjectList = styled.div`
		margin-top: 40px;
	`;

	const ProjectTitle = styled.h3`
		text-align: center;
		margin-bottom: 20px;
	`;

	const PendingAccount = styled.div`
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
		padding: 20px;
	`;

	const InfoSection = styled.div`
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
	`;

	const Title = styled.div`
		font-weight: bold;
		color: #333;
	`;

	const Value = styled.div`
		color: #555;
	`;

	const HighlightBackground = styled.span`
		background: #e0f7fa;
		padding: 0 5px;
		border-radius: 4px;
	`;

	const Button = styled.button`
		padding: 10px 20px;
		margin: 10px 5px;
		font-weight: bold;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		background-color: ${({ color }) => color || "#007bff"};
		&:hover {
			opacity: 0.9;
		}
	`;

	const ApproveButton = styled(Button)`
		background-color: #28a745;
	`;

	const DeclineButton = styled(Button)`
		background-color: #dc3545;
	`;
	useEffect(() => {
		const fetchParkingUsers = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "user"));
				const userList = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				setParkingSeeker(userList);
			} catch (error) {
				console.error("Error fetching parking seeker:", error);
			}
		};

		fetchParkingUsers();
	}, []);

	useEffect(() => {
		const fetchAgents = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "agents"));
				const agentsList = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				setAgent(agentsList);
			} catch (error) {
				console.error("Error fetching agents:", error);
			}
		};

		fetchAgents();
	}, []);

	useEffect(() => {
		const fetchEstablishments = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "establishments"));
				const establishmentsList = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				setEstablishments(establishmentsList);
			} catch (error) {
				console.error("Error fetching establishments:", error);
			}
		};

		fetchEstablishments();
	}, []);

	useEffect(() => {
		setSummaryCardsData([
			{
				title: "Pending Accounts  ",
				value: `${pendingAccounts.length} Account Pending`,
				imgSrc: "pending.png",
			},
			{
				title: "Establishment Accounts",
				value: `${establishments.length} Registered`,
				imgSrc: "check.png",
			},
			{
				title: "Parking Seekers",
				value: `${parkingSeeker.length} Registered`,
				imgSrc: "check.png",
			},
			{ title: "Operator Accounts", value: `${agent.length} Registered`, imgSrc: "check.png" },
		]);
	}, [pendingAccounts]);

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

	const handleApprove = async (account) => {
		try {
			const { id, ...accountData } = account;
	
			// Validate password length
			if (!account.password || account.password.length < 6) {
				alert("Password is too weak. It must be at least 6 characters long.");
				return;
			}
	
			// Create user in Firebase Authentication
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				account.email,
				account.password
			);
	
			const user = userCredential.user;
	
			// Add to 'establishments' collection
			await setDoc(doc(db, "establishments", user.uid), {
				...accountData,
				createdAt: new Date(),
				isApproved: true,
			});
	
			// Remove from pending accounts
			await deleteDoc(doc(db, "pendingEstablishments", id));
	
			// Update local state
			setPendingAccounts((prev) => prev.filter((item) => item.id !== id));
	
			// Success alert
			alert("Account approved successfully.");
		} catch (error) {
			// Error handling
			if (error.code === "auth/weak-password") {
				alert("Password is too weak. It must be at least 6 characters long.");
			} else {
				console.error("Error approving account:", error);
				alert("An error occurred while approving the account.");
			}
		}
	};
	
	
	const handleDecline = async (accountId) => {
		try {
			// Delete the document from the Firestore collection
			await deleteDoc(doc(db, "pendingEstablishments", accountId));
	
			// Update the local state to remove the declined account
			setPendingAccounts((prev) => prev.filter((item) => item.id !== accountId));
	
			alert("Account declined successfully.");
		} catch (error) {
			console.error("Error declining account:", error);
			alert("An error occurred while declining the account.");
		}
	};
	
	return (
		<div className="admin-dashboard">
			<AdminSide />
			<div className="main-content" style={{ padding: "20px" }}>
				<h3>Pending Establishment Accounts</h3>
				{pendingAccounts.length === 0 ? (
					<p style={{ textAlign: "center", marginTop: "20px", fontSize: "16px", color: "#555" }}>
						No pending establishment accounts.
					</p>
				) : (
					<table className="table table-striped table-hover table-bordered">
						<thead>
							<tr>
								<th>Email</th>
								<th>Management Name</th>
								<th>Contact Number</th>
								<th>Address</th>
								<th>Number of Floors</th>
								<th>Total Slots</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{pendingAccounts.map((account) => (
								<tr key={account.id}>
									<td>{account.email}</td>
									<td>{account.managementName}</td>
									<td>{account.contactNumber}</td>
									<td>{account.companyAddress}</td>
									<td>{account.numberOfFloors}</td>
									<td>{account.totalSlots}</td>
									<td>
										<button
											onClick={() => handleApprove(account)}
											className="approve-button"
										>
											Approve
										</button>
										<button
											onClick={() => handleDecline(account.id)}
											className="decline-button"
										>
											Decline
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
	

}

export default AdminPage;