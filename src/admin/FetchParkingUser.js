import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';
import AdminSide from './adminside';

const FetchParkingUsers = () => {
  const [parkingSeeker, setParkingSeeker] = useState([]);

  useEffect(() => {
    const fetchParkingUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'user'));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParkingSeeker(userList);
      } catch (error) {
        console.error('Error fetching parking seeker:', error);
        
      }
    };

    fetchParkingUsers();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
      <AdminSide />

      </div>


      <div  className="main-content container mt-5">
      <h1  className="pending text-center font-weight-bold">Parking Seekers Accounts</h1>
      <hr className="divider" />
      <div className="project-list mt-5 p-3 bg-light rounded" style={{ overflowY: 'scroll', height: '70vh', border: '2px solid #132B4B', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
  {parkingSeeker.length > 0 ? (
    <ul className="list-group"  style={{backgroundColor: 'rgba(19, 43, 75, 0.5)', padding: 10, borderRadius: 20}}>
      {parkingSeeker.map((seeker, index) => (
        <React.Fragment key={seeker.id}>
          <li className="list-group-item d-flex align-items-center"  style={{border: '2px solid #132B4B', borderRadius: 20}}>
            <img
              src={seeker.profileImageUrl || '/defaultt.png'}
              alt={seeker.name}
              className="user-image"
            />
            <div >
              <span className="user-name">{seeker.name}</span>
              <br />
              <span className="user-info">
                Address: {seeker.address} | Email: {seeker.email}
              </span>
            </div>
          </li>
          {index < parkingSeeker.length - 1 && <hr className="horizontal-line" />}
        </React.Fragment>
      ))}
    </ul>
  ) : (
    <p>No parking seekers found.</p>
  )}
        </div>
      </div>
    </div>
  );
};

export default FetchParkingUsers;