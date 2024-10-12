'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../../lib/authContext';
import { addConcertToGroups } from '../../../lib/db';
import { db } from '../../../lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../../globals.css';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendees, setAttendees] = useState<{ email: string; name: string }[]>([]);
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      axios
        .get(`https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${apiKey}`)
        .then((response) => {
          setEvent(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching event details:', error);
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!id || !event) return;

      try {
        const concertDocRef = doc(db, 'concerts', String(id));
        const concertDoc = await getDoc(concertDocRef);

        if (concertDoc.exists()) {
          const concertData = concertDoc.data();
          setAttendees(concertData?.attendees || []);
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        setError('Failed to fetch attendees');
      }
    };

    fetchAttendees();
  }, [id, event]);

  const handleAddToConcertGroups = async () => {
    if (!user) {
      setError('You must be signed in to add concerts.');
      return;
    }

    try {
      await addConcertToGroups(event);
      alert('Concert added to your groups!');
    } catch (error) {
      console.error('Error adding concert:', error);
      setError('Failed to add concert to groups.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>No event found</p>;

  const artistImage = event.images?.find((img: any) => img.width >= 1000)?.url;

  return (
    <div className="event-page">
      <a href="/" className="home-button">
        <img src="/home.svg" alt="Home" className="home-icon" />
      </a>

      <div className="artist-background" style={{ backgroundImage: `url(${artistImage})` }} />

      <div className="event-details-content">
        <h1>{event.name}</h1>
        <p>Date: {event.dates.start.localDate}</p>
        <p>Venue: {event._embedded.venues[0].name}</p>
        <p>
          Location: {event._embedded.venues[0].city.name},{' '}
          {event._embedded.venues[0].state?.name}
        </p>
        <a href={event.url} target="_blank" rel="noopener noreferrer" className="buy-tickets">
          Buy Tickets
        </a>

        {user && (
          <button onClick={handleAddToConcertGroups}>Add to My Concert Groups</button>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="attendees-section">
          <h2>Attendees</h2>
          {attendees.length > 0 ? (
            <ul className="attendee-list">
              {attendees.map((attendee, index) => (
                <li key={index}>
                  {attendee.name} ({attendee.email})
                </li>
              ))}
            </ul>
          ) : (
            <p>No attendees yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
