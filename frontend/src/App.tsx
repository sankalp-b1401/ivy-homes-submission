import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './PrivateRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import Rentals from './pages/Rentals';
import Projects from './pages/Projects';
import SavedListings from './pages/SavedListings';
import Insights from './pages/Insights';
import Health from './pages/Health';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/health" element={<Health />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          
          <Route path="/listings/:id" element={
            <PrivateRoute>
              <ListingDetail />
            </PrivateRoute>
          } />
          
          <Route path="/rentals" element={
            <PrivateRoute>
              <Rentals />
            </PrivateRoute>
          } />
          
          <Route path="/projects" element={
            <PrivateRoute>
              <Projects />
            </PrivateRoute>
          } />

          <Route path="/projects/:id" element={
            <PrivateRoute>
              <Projects />
            </PrivateRoute>
          } />
          
          <Route path="/saved" element={
            <PrivateRoute>
              <SavedListings />
            </PrivateRoute>
          } />
          
          <Route path="/insights" element={
            <PrivateRoute>
              <Insights />
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
