import React, { createContext, useEffect, useState } from "react";

// Create a Context
const RolesContext = createContext();

export const RolesProvider = ({ children }) => {
  const [roles, setRoles] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    setRoles(user?.roles || {});
    setIsAdmin(user?.is_admin || false);
  }

  const checkRole = (role) => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.is_admin || user?.roles?.[role] ? true : false;
  }

  return (
    <RolesContext.Provider value={{ roles, isAdmin, checkRole, fetchRoles }}>
      {children}
    </RolesContext.Provider>
  );
};

export default RolesContext;
