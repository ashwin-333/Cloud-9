import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export const addConcertToGroups = async (concert: any) => {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error('User not signed in or email not available');
  }

  const userConcertsRef = doc(db, 'users', user.uid);
  const userConcertsSnapshot = await getDoc(userConcertsRef);

  const concertData = {
    id: concert.id,
    name: concert.name,
    date: concert.dates.start.localDate,
    venue: concert._embedded.venues[0].name,
    city: concert._embedded.venues[0].city.name,
  };

  const attendeeData = {
    email: user.email,
    name: user.email.split('@')[0] || 'Unknown User',
  };

  if (userConcertsSnapshot.exists()) {
    await updateDoc(userConcertsRef, {
      concertGroups: arrayUnion(concertData),
    });
  } else {
    await setDoc(userConcertsRef, {
      concertGroups: [concertData],
    });
  }

  const concertDocRef = doc(db, 'concerts', concert.id);
  const concertDocSnapshot = await getDoc(concertDocRef);

  if (concertDocSnapshot.exists()) {
    await updateDoc(concertDocRef, {
      attendees: arrayUnion(attendeeData),
    });
  } else {
    await setDoc(concertDocRef, {
      ...concertData,
      attendees: [attendeeData],
    });
  }

  console.log('Concert and attendee added successfully!');
};
