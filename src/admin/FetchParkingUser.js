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
    <table className="table table-striped table-hover">
    <thead className="thead-dark">
      <tr>
        <th scope="col">#</th>
        <th scope="col">Profile</th>
        <th scope="col">Name</th>
        <th scope="col">Address</th>
        <th scope="col">Email</th>
      </tr>
    </thead>
    <tbody>
      {parkingSeeker.map((seeker, index) => (
        <tr key={seeker.id}>
          <th scope="row">{index + 1}</th>
          <td>
            <img
              src={seeker.profileImageUrl || '/defaultt.png'}
              alt={seeker.name}
              className="rounded-circle"
              style={{ width: '50px', height: '50px' }}
            />
          </td>
          <td>{seeker.name}</td>
          <td>{seeker.address}</td>
          <td>{seeker.email}</td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p className="text-center">No parking seekers found.</p>
)}
        </div>
      </div>
    </div>
  );
};

export default FetchParkingUsers;