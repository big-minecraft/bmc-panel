import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {LoadingButton} from './LoadingButton';
import {Lock, User, ArrowRight} from 'lucide-react';

const LoginForm = ({
    username,
    setUsername,
    password,
    setPassword,
    token,
    setToken,
    authStep,
    setAuthStep,
    loading,
    setShowForgotModal,
    handleLogin,
    handleVerifyToken
}) => {
    const [focusedInput, setFocusedInput] = useState(null);

    if (authStep === 1) {
        return (
            <motion.form
                onSubmit={handleLogin}
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.3}}
            >
                <div className="space-y-6">
                    <motion.div
                        className="relative"
                        animate={{scale: focusedInput === 'username' ? 0.98 : 1}}
                        transition={{duration: 0.1}}
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400"/>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       bg-gray-50 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition duration-200"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                            onFocus={() => setFocusedInput('username')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </motion.div>

                    <motion.div
                        className="relative"
                        animate={{scale: focusedInput === 'password' ? 0.98 : 1}}
                        transition={{duration: 0.1}}
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400"/>
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       bg-gray-50 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition duration-200"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </motion.div>

                    <div className="space-y-4">
                        <LoadingButton
                            loading={loading}
                            loadingText="Signing in..."
                            text="Sign In"
                        />

                        <motion.a
                            href="/register"
                            whileHover={{scale: 1.01}}
                            whileTap={{scale: 0.99}}
                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700
                       bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                       transition-colors duration-200"
                        >
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4"/>
                        </motion.a>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="w-full text-sm text-indigo-600 hover:text-indigo-500
                     focus:outline-none focus:underline transition-colors duration-200"
                    >
                        Forgot your password?
                    </button>
                </div>
            </motion.form>
        );
    }

    if (authStep === 2) {
        return (
            <motion.form
                onSubmit={handleVerifyToken}
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.3}}
                className="space-y-6"
            >
                <motion.p
                    className="text-center text-sm text-gray-600"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.2}}
                >
                    Enter the code from your authenticator app
                </motion.p>

                <motion.div
                    className="flex justify-center"
                    initial={{opacity: 0, scale: 0.95}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{delay: 0.3}}
                >
                    <input
                        type="text"
                        className="block w-48 text-center text-2xl py-3 border border-gray-300 rounded-lg
                     bg-gray-50 text-gray-900 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     transition duration-200 tracking-wide"
                        placeholder="000000"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        autoFocus
                    />
                </motion.div>

                <div className="space-y-4">
                    <LoadingButton
                        loading={loading}
                        loadingText="Verifying..."
                        text="Verify Code"
                    />

                    <motion.button
                        type="button"
                        onClick={() => {
                            setAuthStep(1);
                            setToken('');
                        }}
                        whileHover={{scale: 1.01}}
                        whileTap={{scale: 0.99}}
                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium
                     text-gray-700 bg-gray-50 border border-gray-300 rounded-lg
                     hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-gray-500 transition-colors duration-200"
                    >
                        Back to Login
                    </motion.button>
                </div>
            </motion.form>
        );
    }

    return null;
};

export default LoginForm;