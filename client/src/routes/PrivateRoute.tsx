import {Navigate, useLocation} from 'react-router-dom';
import {checkAuthToken} from '../utils/auth';

const PrivateRoute = ({children}) => {
    const location = useLocation();
    const isLoggedIn = checkAuthToken();

    return isLoggedIn ? (
        <>{children}</>
    ) : (
        <Navigate
            replace={true}
            to="/login"
            state={{from: `${location.pathname}${location.search}`}}
        />
    );
};

export default PrivateRoute;