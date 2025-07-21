import React from 'react';
import AppRouter from './routes/routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

export default App;
