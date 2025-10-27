import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { PlanProvider } from './contexts/PlanContext';
import AppRouter from './components/AppRouter';
import UpdateModal from './components/UpdateModal';

function App() {
  return (
    <AuthProvider>
      <PlanProvider>
        <AppRouter />
        <UpdateModal />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </PlanProvider>
    </AuthProvider>
  );
}

export default App;