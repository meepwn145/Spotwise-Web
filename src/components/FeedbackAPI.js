
import firebase from "../config/firebase"
import { getDocs, collection, doc, addDoc, getDoc } from "firebase/firestore";
import {db} from "../config/firebase"

export function fetchAllFeedback() {
  return new Promise((resolve, reject) => {
    getDocs(collection(db, 'feedback'))
      .then(snapshot => {
        const feedbackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        resolve(feedbackData);
      })
      .catch(error => {
        reject(error);
      });
  });
}


export function fetchFeedbackById(id) {
  return new Promise((resolve, reject) => {
    getDoc(doc(db, 'feedback', id))
      .then(docSnapshot => {
        if (docSnapshot.exists()) {
          resolve({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          reject(new Error("Feedback not found"));
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function submitFeedback(newFeedback) {
  return new Promise((resolve, reject) => {
    addDoc(collection(db, 'feedback'), newFeedback)
      .then(docRef => {
        resolve(docRef.id); 
      })
      .catch(error => {
        reject(error);
      });
  });
}