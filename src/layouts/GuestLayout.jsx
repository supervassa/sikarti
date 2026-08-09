// src/layouts/GuestLayout.jsx
import { Outlet } from 'react-router-dom';

// Setiap halaman guest (LandingPage, ProfilePage, dll) sudah membawa
// Navbar & Footer sendiri, jadi layout ini hanya meneruskan Outlet.
export const GuestLayout = () => {
    return <Outlet />;
};
