import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalPage from './pages/admin/ApprovalPage';
import ChildrenPage from './pages/admin/ChildrenPage';
import CaregiversPage from './pages/admin/CaregiversPage';

// Caregiver pages
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import RegisterTime from './pages/caregiver/RegisterTime';
import MyTimeEntries from './pages/caregiver/MyTimeEntries';

export default function App() {
    // Demo: simpel rolle-skift (i produktion ville dette komme fra auth)
    const [userRole, setUserRole] = useState('admin');

    // Demo barnepige ID (i produktion ville dette komme fra auth)
    const caregiverId = 1;

    return (
        <Layout userRole={userRole} onRoleChange={setUserRole}>
            <Routes>
                {/* Root redirect */}
                <Route
                    path="/"
                    element={<Navigate to={userRole === 'admin' ? '/admin' : '/barnepige'} replace />}
                />

                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/godkendelse" element={<ApprovalPage />} />
                <Route path="/admin/boern" element={<ChildrenPage />} />
                <Route path="/admin/barnepiger" element={<CaregiversPage />} />

                {/* Caregiver routes */}
                <Route path="/barnepige" element={<CaregiverDashboard caregiverId={caregiverId} />} />
                <Route path="/barnepige/registrer" element={<RegisterTime caregiverId={caregiverId} />} />
                <Route path="/barnepige/mine-timer" element={<MyTimeEntries caregiverId={caregiverId} />} />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}
