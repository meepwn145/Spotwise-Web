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

            setName(userData.name || "");
            setAddress(userData.address || "");
            setEmail(userData.email || "");
            setContactNumber(userData.contactNumber || "");
            setCompanyName(userData.managementName || "");
            setCompanyAddress(userData.companyAddress || "");
            setCompanyContact(userData.companyContact || "");
            setCompanyEmail(userData.companyEmail || "");
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
          address: address,
          email: email,
          phoneNumber: contactNumber,
        };

        await updateDoc(userDocRef, updatedData);

        console.log("User data updated/created successfully!");
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

  const handleSaveProfile = () => {
    setIsEditing(false);
    updateUserData();
  };

  return (
    <div className="gradient-custom-2" style={{ backgroundColor: 'white' }}>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#132B4B" }}>
        <div className="container">
          <a className="navbar-brand" style={{ padding: 20 }}>
            {/* Your brand/logo here */}
          </a>
        </div>
      </nav>
      <MDBContainer className="py-4">
        <MDBRow>
          <MDBCol lg="4">
            <OperatorReserve />
          </MDBCol>
          <MDBCol lg="8">
            <MDBCard className="mb-4">
              <div className="p-4 text-center">
                <MDBCardImage
                  src={profileImageUrl || "default_placeholder.jpg"}
                  alt="Profile"
                  className="img-fluid rounded-circle mb-4"
                  style={{ width: '150px', height: '150px', objectFit: 'cover', border: '4px solid #132B4B' }}
                />
                {isEditing && (
                  <>
                    <input
                      type="file"
                      onChange={(event) => {
                        setImageUpload(event.target.files[0]);
                      }}
                      className="form-control mb-3"
                    />
                    <MDBBtn onClick={uploadFile}>Upload Image</MDBBtn>
                  </>
                )}
              </div>
              <MDBCardBody className="text-center">
                {isEditing ? (
                  <div className="mb-4">
                    <input type="text" className="form-control mb-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="text" className="form-control mb-3" placeholder="Location" value={address} onChange={(e) => setAddress(e.target.value)} />
                    <input type="text" className="form-control mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="text" className="form-control mb-3" placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                  </div>
                ) : (
                    <div className="p-4">
                        <MDBTypography tag='h5'>{fullName}</MDBTypography>
                    <MDBCardText className="text-muted">{address}</MDBCardText>
                    <MDBCardText className="text-muted">{email}</MDBCardText>
                    <MDBCardText className="text-muted">{contactNumber}</MDBCardText>
                  </div>
                )}
                <MDBBtn
                onClick={isEditing ? handleSaveProfile : toggleEditing}
                className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                style={{ borderRadius: '20px', padding: '10px 20px', minWidth: '150px' }}
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </MDBBtn>
              </MDBCardBody>
            </MDBCard>
            <MDBCard className="mb-4">
              <MDBCardBody className="p-4">
                <h4 className="mb-4">Company's Information</h4>
                {isEditing ? (
                  <div className="mb-4">
                    <input type="text" className="form-control mb-3" placeholder="Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    <input type="text" className="form-control mb-3" placeholder="Location" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                    <input type="text" className="form-control mb-3" placeholder="Contact Number" value={companyContact} onChange={(e) => setCompanyContact(e.target.value)} />
                  </div>
                ) : (
                  <div className="mb-4">
                    <MDBCardText className="font-italic mb-1">{companyName}</MDBCardText>
                    <MDBCardText className="font-italic mb-1">{companyAddress}</MDBCardText>
                    <MDBCardText className="font-italic mb-1">{companyEmail}</MDBCardText>
                    <MDBCardText className="font-italic mb-0">{companyContact}</MDBCardText>
                  </div>
                )}
              </MDBCardBody>
            </MDBCard>
            <MDBCard className="mb-4">
              <MDBCardBody className="p-4">
                <h4 className="mb-4">Currently Works At</h4>
                <div className="mb-4">
                  <MDBCardText className="font-italic mb-1">{companyName}</MDBCardText>
                  <MDBCardText className="font-italic mb-1">{companyAddress}</MDBCardText>
                  <MDBCardText className="font-italic mb-0">{companyContact}</MDBCardText>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}