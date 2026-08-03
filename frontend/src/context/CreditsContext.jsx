import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";


const CreditsContext = createContext();


export function CreditsProvider({ children }) {


    const [credits, setCredits] = useState(null);
    const [loadingCredits, setLoadingCredits] = useState(true);


    const loadCredits = async () => {

        try {

            const {
                data: { user },
                error: userError

            } = await supabase.auth.getUser();


            console.log(
                "SUPABASE USER:",
                user
            );


            if (userError || !user) {

                console.error(
                    "USER ERROR:",
                    userError
                );

                setCredits(null);
                return;
            }


            const url =
            `${import.meta.env.VITE_BACKEND_URL}/credits/${user.email}`;


            console.log(
                "CREDITS URL:",
                url
            );


            const response = await fetch(url);


            console.log(
                "RESPONSE STATUS:",
                response.status
            );


            const data = await response.json();


            console.log(
                "BACKEND DATA:",
                data
            );


            setCredits(data.balance);


        }
        catch(error){

            console.error(
                "CREDITS ERROR:",
                error
            );

            setCredits(0);

        }

        finally{

            setLoadingCredits(false);

        }

    };





    useEffect(()=>{


        loadCredits();


    },[]);





    return (

        <CreditsContext.Provider

            value={{
                credits,
                loadingCredits,
                loadCredits
            }}

        >

            {children}

        </CreditsContext.Provider>

    );


}





export function useCredits(){

    return useContext(CreditsContext);

}