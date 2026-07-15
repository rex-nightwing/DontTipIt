import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  context,
  requestExpandedMode,
} from '@devvit/web/client';

export const Splash = () => {
  return (
    <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center text-white px-8">

      <h1 className="text-4xl font-black tracking-wider">
        DON'T TIP IT
      </h1>

      <p className="mt-5 text-center text-lg opacity-90">
        Keep the world's balance at zero.
      </p>

      <p className="mt-3 text-center opacity-80">
        Every Redditor affects the same equilibrium.
      </p>

      <p className="mt-8 font-semibold">
        Welcome {context.username ?? 'Redditor'}
      </p>

      <button
        className="mt-10 bg-white text-orange-600 rounded-full px-8 py-3 text-lg font-bold hover:bg-gray-100"
        onClick={(event) =>
          requestExpandedMode(event.nativeEvent, 'game')
        }
      >
        Play
      </button>

    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);