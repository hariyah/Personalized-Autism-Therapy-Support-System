import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const TherapyRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/parent/children/${id}?tab=care-plan`} replace />;
};

export default TherapyRedirect;
