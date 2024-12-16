// IPC communication handler
export class IPCHandler {
  static async invokeMain(channel, data) {
    try {
      return await window.ipcRenderer.invoke(channel, data);
    } catch (error) {
      console.error(`IPC error (${channel}):`, error);
      throw error;
    }
  }

  static on(channel, callback) {
    window.ipcRenderer.on(channel, callback);
  }

  static removeListener(channel, callback) {
    window.ipcRenderer.removeListener(channel, callback);
  }
}