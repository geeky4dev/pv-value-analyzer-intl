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
    // LOAD PROFILE FROM SUPABASE
    // =====================================================

    const loadProfile = async (userId) => {


        const { data, error } = await supabase

            .from("profiles")

            .select("*")

            .eq("id", userId)

            .maybeSingle();



        if (error) {


            console.error(
                "PROFILE LOAD ERROR:",
                error
            );


            setProfile(null);


            return null;

        }



        console.log(
            "PROFILE:",
            data
        );



        setProfile(data);



        return data;

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

                        user_id:
                            currentUser.id,


                        email:
                            currentUser.email,


                        name:
                            profileData?.name || "",


                        company:
                            profileData?.company || ""

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

                const syncData = await syncUser(

                    currentUser,

                    profileData

                );


                if (syncData) {

                    setProfile({

                        ...profileData,

                        ...syncData

                    });

                }


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



                    await syncUser(

                        currentUser,

                        profileData

                    );



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
        password
    ) => {


        return await supabase.auth.signUp({

            email,

            password

        });


    };





    // =====================================================
    // LOGOUT
    // =====================================================

    const signOut = async () => {


        return await supabase.auth.signOut();


    };





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

export function useAuth(){


    return useContext(
        AuthContext
    );


}