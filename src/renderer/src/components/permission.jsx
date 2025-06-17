import { useContext } from "react";
import RolesContext from "@/context/roles-context";

const Permission = ({ name, children }) => {
    const { roles, isAdmin } = useContext(RolesContext);

    return (
        (isAdmin || roles[name]) && children
    );
}

export default Permission;