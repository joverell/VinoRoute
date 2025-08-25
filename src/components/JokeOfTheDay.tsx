'use client';

import { useState, useEffect } from 'react';

const JokeOfTheDay = () => {
  const [joke, setJoke] = useState('');

  useEffect(() => {
    const fetchJoke = async () => {
      try {
        const response = await fetch('/api/jokes/random');
        if (!response.ok) {
          throw new Error('Failed to fetch joke');
        }
        const data = await response.json();
        setJoke(data.text);
      } catch (error) {
        console.error('Error fetching joke:', error);
        // You can set a fallback joke here if you want
        setJoke('What did the grape say when it was crushed? Nothing, it just let out a little wine!');
      }
    };

    fetchJoke();
  }, []);

  if (!joke) {
    return null;
  }

  return (
    <div className="joke-container">
      <p className="joke-text fade-in">“{joke}”</p>
    </div>
  );
};

export default JokeOfTheDay;
