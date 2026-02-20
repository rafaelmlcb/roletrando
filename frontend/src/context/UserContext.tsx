import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface UserContextType {
    userName: string | null;
    setUserName: (name: string) => void;
    isNameDefined: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userName, setUserNameState] = useState<string | null>(localStorage.getItem('quiz_user_name'));

    const setUserName = (name: string) => {
        localStorage.setItem('quiz_user_name', name);
        setUserNameState(name);
    };

    const isNameDefined = !!userName;

    return (
        <UserContext.Provider value={{ userName, setUserName, isNameDefined }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
