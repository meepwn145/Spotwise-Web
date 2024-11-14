import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
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
import UserContext from '../UserContext';
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { v4 } from "uuid";

export default function EditButton() {
  const [isEditing, setIsEditing] = useState(false);
  const location = useLocation();
  const { user } = useContext(UserContext);
  const [name, setName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const fullName = `${name} ${lastName}`;
  const [address, setAddress] = useState(user.address || "");
  const [email, setEmail] = useState(user.email || "");
  const [contactNumber, setContactNumber] = useState(user.phoneNumber || "");
  const [companyName, setCompanyName] = useState(user.managementName || "");
  const [companyAddress, setCompanyAddress] = useState(user.companyAddress || "");
  const [companyContact, setCompanyContact] = useState(user.companyContact || "");
  const [companyEmail, setCompanyEmail] = useState(user.companyEmail || "");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [initialData, setInitialData] = useState({});


  const userDocRef = auth.currentUser ? doc(db, 'agents', auth.currentUser.uid) : null;

  const [imageUpload, setImageUpload] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const saveProfileImageUrl = async (url) => {
    if (userDocRef) {
      await updateDoc(userDocRef, {
        profileImageUrl: url,
      });
    }
  };

  useEffect(() => {
    if (userDocRef) {
      const fetchImageUrl = async () => {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setProfileImageUrl(userData.profileImageUrl);
        } else {
          console.log('No such document!');
        }
      };

      fetchImageUrl().catch(console.error);
    }
  }, [userDocRef]);

  const imagesListRef = ref(storage, "images/");
  const uploadFile = () => {
    if (imageUpload && auth.currentUser) {
      const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
      uploadBytes(imageRef, imageUpload).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((url) => {
          setProfileImageUrl(url);
          saveProfileImageUrl(url);
        });
      });
    }
  };

  useEffect(() => {
    listAll(imagesListRef).then((response) => {
      response.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          setImageUrls((prev) => [...prev, url]);
        });
      });
    });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;

          const doc = await db.collection("agents").doc(userId).get();

          if (doc.exists) {
            const userData = doc.data();

            setInitialData(userData);  // Store initial data
            setName(userData.name || "");
            setAddress(userData.address || "");
            setEmail(userData.email || "");
            setContactNumber(userData.contactNumber || "");
            setCompanyName(userData.managementName || "");
            setCompanyAddress(userData.companyAddress || "");
            setCompanyContact(userData.companyContact || "");
            setCompanyEmail(userData.companyEmail || ""); // Set the email here

          } else {
            console.log("No user data found!");
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, []);

  const updateUserData = async () => {
    try {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const userDocRef = doc(db, 'agents', userId);

        const updatedData = {
          firstName: name,
          lastName: lastName,
          address: address,
          email: email,
          phoneNumber: contactNumber,
          profileImageUrl: profileImageUrl,
        };

        await updateDoc(userDocRef, updatedData);
        console.log("User data updated successfully!");
        setInitialData(updatedData);  // Update initial data to the new saved state
      } else {
        console.error("User not authenticated");
      }
    } catch (error) {
      console.error("Error updating user data: ", error);
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };
  const cancelChanges = () => {
    // Reset fields to the initial data
    setName(initialData.firstName || "");
    setLastName(initialData.lastName || "");
    setAddress(initialData.address || "");
    setEmail(initialData.email || "");
    setContactNumber(initialData.phoneNumber || "");
    setProfileImageUrl(initialData.profileImageUrl || "");
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    updateUserData();
  };

  return (
    <div className="gradient-custom-2" style={{ backgroundColor: 'white' }}>
        <div className="container">
          <a className="navbar-brand" style={{ padding: 20 }}>
            {/* Your brand/logo here */}
          </a>
        </div>
      <MDBContainer className="py-4">
        <MDBRow>
          <MDBCol lg="4">
            <OperatorReserve />
          </MDBCol>
          
          <MDBCol lg="8">
          <MDBCard className="mb-4 custom-card" >
          <MDBCardBody className="text-center">
          <div className="p-4">
            <MDBCardImage
              src={profileImageUrl || "default_placeholder.jpg"}
              alt="Profile"
              className="img-fluid rounded-circle mb-3"
              style={{ width: '150px', height: '150px', objectFit: 'cover', border: '4px solid #132B4B' }}
            />
            <h4 className="mb-3">Parking Operator's Information</h4>
            
            {isEditing && (
              <>
                <input
                  type="file"
                  onChange={(event) => setImageUpload(event.target.files[0])}
                  className="form-control mb-3"
                />
                <MDBBtn onClick={uploadFile} className="mb-3">Upload Image</MDBBtn>
              </>
            )}
          </div>

          {isEditing ? (
            <div className="mb-2">
              <input type="text" className="form-control mb-2" placeholder="First Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="text" className="form-control mb-2" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <input type="text" className="form-control mb-2" placeholder="Location" value={address} onChange={(e) => setAddress(e.target.value)} />
              <input type="text" className="form-control mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="text" className="form-control mb-2" placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
            </div>
          ) : (
            <div className="p-1">
              <MDBCardText className="text-muted">
                <span className="fw-bold">Name: </span>{`${name} ${lastName}`}
              </MDBCardText>
              <MDBCardText className="text-muted">
                <span className="fw-bold">Address: </span> {address}
              </MDBCardText>
              <MDBCardText className="text-muted">
                <span className="fw-bold">E-mail: </span>{email}
              </MDBCardText>
              <MDBCardText className="text-muted">
                <span className="fw-bold">Contact #: </span>{contactNumber}
              </MDBCardText>
            </div>
          )}

          <div className="d-flex justify-content-center gap-2 mt-3">
            {isEditing && (
              <MDBBtn onClick={cancelChanges} className="btn btn-warning" style={{ borderRadius: '20px', padding: '10px 20px' }}>
                Cancel Changes
              </MDBBtn>
            )}
            <MDBBtn onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)} className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`} style={{ borderRadius: '20px', padding: '10px 20px' }}>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </MDBBtn>
          </div>
        </MDBCardBody>
        </MDBCard>
            <MDBCard className="mb-4 custom-card">
                <h4 className="mb-4">Establishment's Information</h4>        
                     
                <div className="mb-4">
                <MDBCardText className="font-italic mb-1">
                  <span className="fw-bold">Establishment:</span> {companyName}
                </MDBCardText>
                <MDBCardText className="font-italic mb-1">
                  <span className="fw-bold">Address:</span> {companyAddress}
                </MDBCardText>
                <MDBCardText className="font-italic mb-1">
                  <span className="fw-bold">E-mail:</span> {companyEmail}
                </MDBCardText>
                <MDBCardText className="font-italic mb-0">
                  <span className="fw-bold">Contact Number:</span> {companyContact}
                </MDBCardText>
              </div>

            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
      
    </div>
  );
}