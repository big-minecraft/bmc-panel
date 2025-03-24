import {useRef} from 'react';
import {BrowserRouter as Router} from 'react-router-dom';
import NavigationBar from "./features/navbar/components/NavigationBar";
import AppRoutes from "./routes/AppRoutes";
import {AuthProvider} from './features/auth/context/AuthContext';
import {SocketProvider} from "./features/socket/context/SocketContext.tsx";
import {GlobalProvider} from "./context/GlobalContext.tsx";

function App() {
    const ref = useRef(null);

    return (
        <Router>
            <GlobalProvider>
                <SocketProvider>
                    <AuthProvider>
                        <div ref={ref} className="min-h-screen bg-gray-50">
                            <NavigationBar/>
                            <div className="max-w-7xl mx-auto px-4 py-6">
                                <AppRoutes/>
                            </div>
                        </div>
                    </AuthProvider>
                </SocketProvider>
            </GlobalProvider>
        </Router>
    );
}

export default App;