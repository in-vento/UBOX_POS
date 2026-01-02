const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getHWID: () => ipcRenderer.invoke('get-hwid'),
    startTunnel: (port) => ipcRenderer.invoke('start-tunnel', port),
    stopTunnel: () => ipcRenderer.invoke('stop-tunnel'),
    on: (channel, func) => {
        const validChannels = ['update-available', 'update-downloaded'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    send: (channel, data) => {
        const validChannels = ['quit-and-install'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    removeAllListeners: (channel) => {
        const validChannels = ['update-available', 'update-downloaded'];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    }
});
