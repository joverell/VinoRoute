'use client';

import { useState, useEffect } from 'react';

const JokeOfTheDay = () => {
  const [jokes, setJokes] = useState<any[]>([]);
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const fetchJokes = async () => {
      try {
        const response = await fetch('https://v2.jokeapi.dev/joke/Any?contains=wine&amount=10&safe-mode');
        const data = await response.json();
        if (data.jokes && data.jokes.length > 0) {
          setJokes(data.jokes);
        } else {
          setJokes([{ joke: 'What did the grape say when it was crushed? Nothing, it just let out a little wine!' }]);
        }
      } catch (error) {
        console.error('Error fetching jokes:', error);
        setJokes([{ joke: 'What did the grape say when it was crushed? Nothing, it just let out a little wine!' }]);
      }
    };

    fetchJokes();
  }, []);

  useEffect(() => {
    if (jokes.length > 1) {
      const timer = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setCurrentJokeIndex((prevIndex) => (prevIndex + 1) % jokes.length);
          setFade(true);
        }, 500); // half a second for fade out
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [jokes]);

  if (jokes.length === 0) {
    return null;
  }

  const currentJoke = jokes[currentJokeIndex];
  const jokeText = currentJoke.type === 'single' ? currentJoke.joke : `${currentJoke.setup} ... ${currentJoke.delivery}`;

  return (
    <div className="joke-container">
      <p className={`joke-text ${fade ? 'fade-in' : 'fade-out'}`}>“{jokeText}”</p>
    </div>
  );
};

export default JokeOfTheDay;
