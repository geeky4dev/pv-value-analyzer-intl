// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";


// =====================================================
// CREAR CONTEXTO
// =====================================================

const AuthContext = createContext();



// =====================================================
// AUTH PROVIDER
// =====================================================

export function AuthProvider({ children }) {


    const [user, setUser] = useState(null);

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);


    // =====================================================
    // LOAD PROFILE FROM SUPABASE AUTH
    // =====================================================

    const loadProfile = async (userId) => {

        const {
            data: { user: authUser },
            error
        } = await supabase.auth.getUser();

        if (error || !authUser || authUser.id !== userId) {

            console.error(
                "PROFILE LOAD ERROR:",
                error
            );

            setProfile(null);

            return null;
        }

        const profileData = {
            id: authUser.id,
            email: authUser.email || "",
            name: authUser.user_metadata?.name || "",
            company: authUser.user_metadata?.company || "",
            created_at: authUser.created_at || null
        };

        console.log(
            "PROFILE:",
            profileData
        );

        setProfile(profileData);

        return profileData;
    };





    // =====================================================
    // SYNC SUPABASE AUTH -> BACKEND DATABASE
    // auth.users
    //      |
    //      ↓
    // public.users
    //      |
    //      ↓
    // credit_accounts
    // =====================================================

    const syncUser = async (
        currentUser,
        profileData
    ) => {


        const API_URL =
            import.meta.env.VITE_BACKEND_URL;


        // =================================================
        // GET CURRENT SUPABASE SESSION
        // =================================================

        const {
            data: {
                session
            }
        } = await supabase.auth.getSession();


        const accessToken =
            session?.access_token;



        try {


            const response = await fetch(

                `${API_URL}/users/sync`,

                {

                    method: "POST",


                    headers: {

                        "Content-Type":
                            "application/json"

                    },


                    body: JSON.stringify({

                        access_token:
                            accessToken,

                        user_id:
                            currentUser.id,

                        email:
                            currentUser.email,

                        name:
                            profileData?.name ||
                            currentUser.user_metadata?.name ||
                            "",

                        company:
                            profileData?.company ||
                            currentUser.user_metadata?.company ||
                            ""

                    })

                }

            );



            if (!response.ok) {


                throw new Error(
                    `SYNC ERROR ${response.status}`
                );

            }



            const data =
                await response.json();



            console.log(
                "USER SYNC:",
                data
            );



            return data;



        } catch(error) {


            console.error(

                "USER SYNC FAILED:",

                error

            );


            return null;

        }

    };





    // =====================================================
    // INITIAL SESSION
    // =====================================================

    useEffect(() => {


        const initializeAuth = async () => {


            const {
                data
            } =
            await supabase.auth.getSession();



            const currentUser =
                data.session?.user || null;



            console.log(
                "SESSION USER:",
                currentUser
            );



            setUser(
                currentUser
            );



            if (currentUser) {


                const profileData =
                    await loadProfile(
                        currentUser.id
                    );


                const syncData =
                    await syncUser(

                        currentUser,

                        profileData

                    );



                if (syncData) {

                    setProfile({

                        ...profileData,

                        ...syncData

                    });

                }


            }



            setLoading(false);



        };



        initializeAuth();





        // =================================================
        // AUTH STATE CHANGES
        // =================================================

        const {
            data:
            {
                subscription
            }

        } = supabase.auth.onAuthStateChange(


            async (
                _event,
                session
            ) => {


                console.log(

                    "AUTH EVENT:",

                    _event,

                    session

                );



                const currentUser =
                    session?.user || null;



                setUser(
                    currentUser
                );



                if (currentUser) {

                    const profileData =
                        await loadProfile(
                            currentUser.id
                        );

                    const syncData =
                        await syncUser(
                            currentUser,
                            profileData
                        );

                    if (syncData) {

                        setProfile({

                            ...profileData,
                            ...syncData

                        });

                    }
                }
                else {


                    setProfile(null);


                }


            }


        );



        return () => {


            subscription.unsubscribe();


        };


    }, []);





    // =====================================================
    // LOGIN
    // =====================================================

    const signIn = async (
        email,
        password
    ) => {


        return await supabase.auth.signInWithPassword({

            email,

            password

        });


    };

    // =====================================================
    // REGISTER
    // =====================================================

    const signUp = async (
        email,
        password,
        name,
        company,
        redirectTo
    ) => {

        return await supabase.auth.signUp({

            email,

            password,

            options: {

                emailRedirectTo: redirectTo,

                data: {
                    name: name,
                    company: company
                }

            }

        });

    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const signOut = async () => {


        return await supabase.auth.signOut();


    };





    // =====================================================
    // AUTH CONTEXT
    // =====================================================

    return (

        <AuthContext.Provider


            value={{

                user,

                profile,

                loading,

                signIn,

                signUp,

                signOut

            }}


        >


            {children}


        </AuthContext.Provider>


    );


}





// =====================================================
// CUSTOM HOOK
// =====================================================

export function useAuth() {


    return useContext(
        AuthContext
    );


}