import { createContext, useContext, useState, useEffect } from 'react';
import { account, databases, DB_ID, COLLECTIONS } from '../lib/appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const accountData = await account.get();
            // Fetch extral profile data from Database
            try {
                const profileDoc = await databases.getDocument(
                    DB_ID,
                    COLLECTIONS.USERS,
                    accountData.$id
                );
                setUser({ ...accountData, ...profileDoc });
            } catch (profileError) {
                console.warn("User has auth but no profile doc:", profileError);
                setUser(accountData);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            await account.createEmailPasswordSession(email, password);
            await checkUserStatus();
            return true;
        } catch (error) {
            // Si ya hay sesión activa, simplemente actualizamos el estado
            if (error.message && error.message.includes('creation of a session is prohibited')) {
                await checkUserStatus();
                return true;
            }
            console.error("Error al iniciar sesión:", error);
            throw error;
        }
    };

    const signup = async (formData) => {
        try {
            // 1. Crear usuario en Auth
            const newAccount = await account.create(ID.unique(), formData.email, formData.password, formData.name);

            // 2. Iniciar sesión automáticamente
            try {
                await account.createEmailPasswordSession(formData.email, formData.password);
            } catch (sessionError) {
                // Si el usuario ya tenía sesión (raro en registro pero posible), continuamos
                if (!sessionError.message?.includes('creation of a session is prohibited')) {
                    throw sessionError;
                }
            }

            // 3. Crear documento de perfil en base de datos
            const profileData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role || 'owner',
                community_id: formData.community_id,
                unit: formData.unit,
                // linked_owner_id logic if needed
            };

            await databases.createDocument(
                DB_ID,
                COLLECTIONS.USERS,
                newAccount.$id, // Use same ID as Auth
                profileData
            );

            // 4. Update state
            await checkUserStatus();

            return true;
        } catch (error) {
            console.error("Error al registrarse:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
