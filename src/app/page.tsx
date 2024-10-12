'use client';

import React, { useState, useEffect } from 'react';
import RootLayout from './layout';
import './globals.css';
import axios from 'axios';
import { signInWithGoogle, logOut } from '../lib/auth';
import { useAuth } from '../lib/authContext';
import { db } from '../lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const LandingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [concertGroups, setConcertGroups] = useState<any[]>([]);
  const [hover, setHover] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConcertGroups();
    }
  }, [user]);

  const fetchConcertGroups = async () => {
    try {
      if (!user) return;

      const userConcertsRef = doc(db, 'users', user.uid);
      const userConcertsSnapshot = await getDoc(userConcertsRef);

      if (userConcertsSnapshot.exists()) {
        setConcertGroups(userConcertsSnapshot.data().concertGroups || []);
      } else {
        setConcertGroups([]);
      }
    } catch (error) {
      console.error('Error fetching concert groups:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events.json`,
        {
          params: {
            keyword: searchTerm,
            apikey: process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY,
            classificationName: 'Music',
            size: 10,
          },
        }
      );

      if (response.data._embedded) {
        setEvents(response.data._embedded.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again.');
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout Error:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  return (
    <RootLayout>
      <div className="container">
        <a href="/" className="home-button">
          <img src="/home.svg" alt="Home" className="home-icon" />
        </a>
        <img src="/logo.svg" alt="Logo" className="logo" />

        <div className="top-right-buttons">
          {user ? (
            <>
              <div
                className="concert-groups-wrapper"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                <button className="concert-groups-button">
                  <img src="/concertgroups.svg" alt="Concert Groups" />
                </button>
                {hover && (
                  <div className="concert-groups-dropdown">
                    {concertGroups.length > 0 ? (
                      <ul>
                        {concertGroups.map((concert) => (
                          <li key={concert.id}>
                            <a href={`/performance/${concert.id}`}>
                              {concert.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No concerts found</p>
                    )}
                  </div>
                )}
              </div>
              <button onClick={handleLogOut} className="logout-button">
                Log Out
              </button>
            </>
          ) : (
            <button
              className="google-sign-in-button"
              onClick={handleGoogleSignIn}
            >
              Sign In
            </button>
          )}
        </div>

        <section>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </section>

        <section>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Find a concert"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className="results">
            {events.length > 0 ? (
              <div className="event-grid">
                {events.map((event) => (
                  <div key={event.id} className="event-box">
                    <a href={`/performance/${event.id}`}></a>
                    <a href={`/performance/${event.id}`}>
                      <h2>{event.name}</h2>
                      <p>{event.dates.start.localDate}</p>
                      <p>{event._embedded.venues[0].name}</p>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              !loading && <p>We couldn't find anything for "{searchTerm}"</p>
            )}
          </div>
        </section>
      </div>
    </RootLayout>
  );
};

export default LandingPage;
