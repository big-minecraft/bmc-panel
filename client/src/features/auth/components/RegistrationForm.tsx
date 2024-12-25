import React from 'react';
import {motion} from 'framer-motion';
import {LoadingButton} from './LoadingButton';
import {Check, User, Lock, Key} from 'lucide-react';
import {useAuthContext} from '../context/AuthContext';

const formVariants = {
    hidden: {opacity: 0, x: -20},
    visible: {opacity: 1, x: 0}
};

const RegistrationForm = ({
    inviteCode,
    setInviteCode,
    username,
    setUsername,
    password,
    setPassword,
    token,
    setToken,
    qrCode,
    success,
    verifyInvite,
    submitCredentials,
    verifyToken
}) => {
    const {authStep, loading} = useAuthContext();

    const stepCircle = (number, active, completed) => (
        <motion.div
            className={`flex items-center justify-center w-8 h-8 rounded-full 
                ${completed ? 'bg-green-500' : active ? 'bg-indigo-600' : 'bg-gray-200'}`}
            whileHover={!completed && !active ? {scale: 1.05} : {}}
            initial={{scale: 0.9, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
        >
            {completed ? (
                <Check className="w-5 h-5 text-white"/>
            ) : (
                <span className={`text-sm ${active ? 'text-white' : 'text-gray-600'}`}>
          {number}
        </span>
            )}
        </motion.div>
    );

    const renderStepIndicator = () => (
        <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
                {stepCircle(1, authStep === 1, authStep > 1)}
                <div className="w-12 h-0.5 bg-gray-200">
                    <motion.div
                        className="h-full bg-indigo-600"
                        initial={{width: "0%"}}
                        animate={{width: authStep > 1 ? "100%" : "0%"}}
                        transition={{duration: 0.5}}
                    />
                </div>
                {stepCircle(2, authStep === 2, authStep > 2)}
                <div className="w-12 h-0.5 bg-gray-200">
                    <motion.div
                        className="h-full bg-indigo-600"
                        initial={{width: "0%"}}
                        animate={{width: authStep > 2 ? "100%" : "0%"}}
                        transition={{duration: 0.5}}
                    />
                </div>
                {stepCircle(3, authStep === 3, authStep > 3)}
            </div>
        </div>
    );

    if (authStep === 1) {
        return (
            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
                transition={{duration: 0.5}}
            >
                {renderStepIndicator()}
                <form onSubmit={verifyInvite} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="h-5 w-5 text-gray-400"/>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       bg-gray-50 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition duration-200"
                            placeholder="Enter invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            required
                        />
                    </div>
                    <LoadingButton
                        loading={loading}
                        loadingText="Verifying Code..."
                        text="Verify Invite Code"
                    />
                </form>
            </motion.div>
        );
    }

    if (authStep === 2) {
        return (
            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
                transition={{duration: 0.5}}
            >
                {renderStepIndicator()}
                <form onSubmit={submitCredentials} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400"/>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       bg-gray-50 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition duration-200"
                            placeholder="Choose username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400"/>
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       bg-gray-50 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition duration-200"
                            placeholder="Choose password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <LoadingButton
                        loading={loading}
                        loadingText="Creating Account..."
                        text="Create Account"
                    />
                </form>
            </motion.div>
        );
    }

    if (authStep === 3) {
        return (
            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
                transition={{duration: 0.5}}
                className="space-y-6"
            >
                {renderStepIndicator()}
                <div className="text-center">
                    <motion.div
                        initial={{scale: 0.9, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        transition={{duration: 0.5}}
                        className="mb-6"
                    >
                        <img src={qrCode} alt="QR Code" className="mx-auto max-w-[200px]"/>
                    </motion.div>
                    <p className="text-sm text-gray-600 mb-6">
                        Scan this QR code with your authenticator app
                    </p>
                </div>
                <form onSubmit={verifyToken} className="space-y-6">
                    <input
                        type="text"
                        className="block w-full text-center text-2xl py-3 border border-gray-300 rounded-lg
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
                    />
                    <LoadingButton
                        loading={loading}
                        loadingText="Verifying..."
                        text="Verify Code"
                    />
                </form>
            </motion.div>
        );
    }

    if (authStep === 4) {
        return (
            <motion.div
                initial={{opacity: 0, scale: 0.9}}
                animate={{opacity: 1, scale: 1}}
                className="rounded-lg bg-green-50 p-6 text-center"
            >
                <motion.div
                    initial={{scale: 0}}
                    animate={{scale: 1}}
                    transition={{type: "spring", stiffness: 200, damping: 15}}
                    className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center"
                >
                    <Check className="w-8 h-8 text-green-600"/>
                </motion.div>
                <h3 className="text-lg font-medium text-green-900 mb-2">Success!</h3>
                <p className="text-sm text-green-600">
                    Your account has been created successfully. You can now login with your credentials.
                </p>
            </motion.div>
        );
    }

    return null;
};

export default RegistrationForm;