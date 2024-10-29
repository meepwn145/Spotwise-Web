import React, { useState } from 'react';
import { db, auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';

function Create() {
  const [managementName, setManagementName] = useState('');
  const [companyAddress, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [numberOfParkingLots, setNumberOfParkingLots] = useState('');
  const [parkingPay, setParkingPayment] = useState('');
  const [contact, setContact] = useState('');
  const [isApproved, setIsApproved] = useState (false);
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Save to pendingEstablishments
      await setDoc(doc(db, "pendingEstablishments", user.uid), {
        email,
        companyAddress,
        contact,
        numberOfParkingLots,
        managementName,
        parkingPay,
        password,
        isApproved: false, 
      });
  
    alert('We are currently processing your account. Please wait for admins approval. Thank you!');
    navigate("/");
      
    } catch (error) {
      console.error('Error creating account:', error);
      alert(error.message);
    }
  };

  const handleParkingTypeChange = (e) => {
    setNumberOfParkingLots(e.target.value);
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column', 
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  };

  const formContainerStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
    width: '400px',
    marginTop: '50px',
  };

  const inputGroupStyle = {
    marginBottom: '15px',
    marginRight: '30px',
    marginTop: '10px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1877f2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '18px',
  };

  const navbarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'black',
    color: 'white',
    width: '100%',
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle}>
      <div style={navbarStyle}>
        <div style={logoStyle}>SpotWise Parking Management</div>
      </div>
      <div style={formContainerStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px'}}>Create a New Account</h2>
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
            <input
              type="text"
              placeholder="Address"
              value={companyAddress}
              onChange={(e) => setAddress(e.target.value)}
              required
              style={inputStyle}
            />
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
            <label htmlFor="numberOfParkingLots">Number of Parking Lots Available</label>
            <input
              type="number"
              id="numberOfParkingLots"
              value={numberOfParkingLots}
              onChange={handleParkingTypeChange}
              required
              style={inputStyle}
            />
          </div>
          <div style={inputGroupStyle}>
            <input
              type='text'
              placeholder="Contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={inputGroupStyle}>
            <input
              type='text'
              placeholder="Parking Payment"
              value={parkingPay}
              onChange={(e) => setParkingPayment(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" style={buttonStyle}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default Create;