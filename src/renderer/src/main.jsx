import './assets/css/tailwind.css'
import './assets/css/main.css'

const { ipcRenderer } = window.electron || {};
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { HashRouter } from 'react-router-dom'
import axios from 'axios'
import { setDefaultOptions } from "date-fns";
import { fr } from "date-fns/locale";
import { RolesProvider } from "@/context/roles-context";
import { SocketProvider } from './context/socket-context';

setDefaultOptions({ locale: fr });

ipcRenderer.invoke('get-server-ip').then((serverIP) => {
  axios.defaults.baseURL = `http://${serverIP || 'localhost'}:4000`
})

axios.interceptors.response.use(resp => resp.data, error => {
  if (!error.response)
    return Promise.reject(error);

  const { status } = error.response;
  if (status === 401 || status === 403) {
    localStorage.removeItem("user");
    window.location.hash = "#/login";
  }

  return Promise.reject(error);
})

axios.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  else {
    window.location.hash = "#/login";
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <SocketProvider>
        <RolesProvider>
          <App />
        </RolesProvider>
      </SocketProvider>
    </HashRouter>
  </React.StrictMode>
)
