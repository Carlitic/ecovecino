import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Escuchar cambios de autenticación en tiempo real
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Si el usuario está logueado, buscamos sus datos extra (Rol, Comunidad, etc) en Firestore
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));

                if (userDoc.exists()) {
                    setUser({ ...currentUser, ...userDoc.data() });
                } else {
                    // Fallback si no hay perfil aún (raro)
                    setUser(currentUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            throw error; // Lanzamos el error para que LoginPage lo maneje (mostrar alerta)
        }
    };

    const signup = async (formData) => {
        try {
            // 1. Crear el usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Guardar los datos del perfil en Firestore
            const profileData = {
                uid: user.uid,
                email: formData.email,
                name: formData.name,
                role: formData.role,
                phone: formData.phone || '',
                unit: formData.unit || '',
                community_id: formData.community_id || null, // OJO: Esto será el ID de la comunidad en Firestore
                created_at: new Date().toISOString()
            };

            await setDoc(doc(db, "users", user.uid), profileData);

            // Actualizamos el estado local inmediatamente (opcional, ya que el listener lo haría)
            // setUser({ ...user, ...profileData }); 

            return true;
        } catch (error) {
            console.error("Error al registrarse:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
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
