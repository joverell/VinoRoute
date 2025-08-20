'use client';

import { useState, useEffect } from 'react';

const JokeOfTheDay = () => {
  const [joke, setJoke] = useState('');

  useEffect(() => {
    // For now, let's use a hardcoded joke.
    // I'll replace this with a joke API later.
    setJoke('What did the grape say when it was crushed? Nothing, it just let out a little wine!');
  }, []);

  if (!joke) {
    return null;
  }

  return (
    <div className="joke-container">
      <p className="joke-text">“{joke}”</p>
    </div>
  );
};

export default JokeOfTheDay;
