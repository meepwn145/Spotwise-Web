const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotificationOnReservationStatusChange = functions.firestore
    .document('reservations/{reservationId}')
    .onUpdate((change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        if (newValue.status !== previousValue.status) {
            const payload = {
                notification: {
                    title: `Reservation ${newValue.status}`,
                    body: `Your reservation has been ${newValue.status.toLowerCase()}`,
                }
            };

            const topic = newValue.userUid; // Use the UID as the topic name
            return admin.messaging().sendToTopic(topic, payload)
                .then(response => {
                    console.log('Notification sent successfully:', response);
                    return null;
                })
                .catch(error => {
                    console.error('Error sending notification:', error);
                });
        } else {
            return null;
        }
    });
