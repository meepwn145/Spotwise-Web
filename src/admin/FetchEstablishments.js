import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminSide from './adminside';

const FetchEstablishments = () => {
  const [establishments, setEstablishments] = useState([]);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "establishments"));
        const establishmentsList = querySnapshot.docs.map(doc => ({
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

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
      <AdminSide />

      </div>
      
      <div className="main-content container mt-5">
        <h1 className="pending text-center font-weight-bold">Establishments Accounts</h1>
        <hr className="divider" />
        <div className="project-list mt-5 p-3 bg-light rounded" style={{ overflowY: 'scroll', height: '70vh', border: '2px solid #132B4B', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
          {establishments.length > 0 ? (
            <ul className="list-group"  style={{backgroundColor: 'rgba(19, 43, 75, 0.5)', padding: 10, borderRadius: 20}}>
              {establishments.map((establishment, index) => (
                <React.Fragment key={establishment.id}>
                  <li className="list-group-item d-flex align-items-center"  style={{border: '2px solid #132B4B', borderRadius: 20}}>
                    <img
                      src={establishment.profileImageUrl || '/defaultt.png'}
                      alt={establishment.managementName}
                      className="rounded-circle mr-3"
                      style={{ width: '85px'}}
                    />
                    <div>
                      <h5 className="mb-1">
                        Establishment: <span className="font-weight-bold">{establishment.managementName}</span>
                      </h5>
                      <p className="mb-1">
                        Parking Location: {establishment.companyAddress}
                      </p>
                      <p className="mb-0">
                        Approved on: {establishment.createdAt?.seconds
                          ? new Date(establishment.createdAt.seconds * 1000).toLocaleDateString()
                          : 'Date not available'}
                      </p>
                    </div>
                  </li>
                  {index < establishments.length - 1 && <hr />}
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <p className="text-center">No establishments found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export default FetchEstablishments;