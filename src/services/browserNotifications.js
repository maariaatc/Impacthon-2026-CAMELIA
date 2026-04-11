export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones de escritorio.");
    return false;
  }
  
  if (Notification.permission === "granted") return true;

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
};

export const sendJobCompletedNotification = (jobId) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("¡Tu predicción está lista! 🧬", {
      body: `AlphaFold2 ha terminado de procesar el trabajo ${jobId}.`,
      icon: "/favicon.ico", 
      vibrate: [200, 100, 200],
    });
  }
};