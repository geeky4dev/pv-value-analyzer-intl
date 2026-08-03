// frontend/src/context/ReportsContext.jsx

import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const ReportsContext = createContext();

export function ReportsProvider({ children }) {

    const {
        user
    } = useAuth();

    const [reports, setReports] = useState([]);

    const [loadingReports, setLoadingReports] = useState(true);


    const loadReports = async () => {

        if (!user) {

            setReports([]);
            setLoadingReports(false);
            return;

        }

        setLoadingReports(true);

        const { data, error } = await supabase
            .from("reports")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(
                "REPORTS LOAD ERROR:",
                error
            );

            setReports([]);

        } else {

            setReports(data);

        }

        setLoadingReports(false);

    };


    useEffect(() => {

        loadReports();

    }, [user]);


    const refreshReports = async () => {

        await loadReports();

    };


    return (

        <ReportsContext.Provider

            value={{

                reports,

                loadingReports,

                refreshReports

            }}

        >

            {children}

        </ReportsContext.Provider>

    );

}


export function useReports() {

    return useContext(ReportsContext);

}