// client/src/utils/auth.js
import Cookies from 'js-cookie';

export const setAuthToken = (token) => {
    Cookies.set('token', token, { expires: 7 });
};

export const getToken = () => {
    return Cookies.get('token');
};

export const clearToken = () => {
    Cookies.remove('token');
};