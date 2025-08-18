import React from 'react';

const Banner = () => {
  return (
    <div className="bg-gray-800 text-white p-4 flex items-center print:hidden">
      {/*
        TODO: Replace this placeholder with the actual logo.
        The original URL provided was not a direct image link.
        A new, direct URL to the logo image is needed.
      */}
      <div className="w-12 h-12 bg-gray-700 rounded-full mr-4 flex-shrink-0"></div>
      <div>
        <h1 className="text-2xl font-bold">VinoRoute</h1>
        <p className="text-sm">Discover your next favourite drop.</p>
      </div>
    </div>
  );
};

export default Banner;
