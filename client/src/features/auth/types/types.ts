interface LoginFormProps {
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    token: string;
    setToken: React.Dispatch<React.SetStateAction<string>>;
    authStep: number;
    setAuthStep: React.Dispatch<React.SetStateAction<number>>;
    loading: boolean;
    setShowForgotModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleLogin: (e: React.FormEvent) => Promise<void>;
    handleVerifyToken: (e: React.FormEvent) => Promise<void>;
}

interface LoginHookReturn {
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    token: string;
    setToken: React.Dispatch<React.SetStateAction<string>>;
    authStep: number;
    setAuthStep: React.Dispatch<React.SetStateAction<number>>;
    loading: boolean;
    showForgotModal: boolean;
    setShowForgotModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleLogin: (e: React.FormEvent) => Promise<void>;
    handleVerifyToken: (e: React.FormEvent) => Promise<void>;
}