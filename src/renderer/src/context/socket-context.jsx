import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState({
        on: () => { },
        emit: () => { },
        disconnect: () => { },
        connect: () => { }
    })

    useEffect(() => {
        if (!window?.electron?.ipcRenderer) return

        window.electron.ipcRenderer
            .invoke("get-server-ip")
            .then((ip) => {
                const socketInstance = io(`http://${ip || 'localhost'}:4000`, {
                    autoConnect: false
                })
                setSocket(socketInstance)
            })
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)
