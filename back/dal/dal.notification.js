const { Notification } = require('./types');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const getNotification = async (notifyId) => {
  const notification = 
    await execSQL.all(`SELECT * FROM notifications WHERE notifyId = ${notifyId}`);

  return new Notification(notification[0]);
};

const getSystemAdminNotification = async () => {
  const notification = 
    await execSQL.all('SELECT * FROM notifications WHERE notifyId = 1');

  return new Notification(notification[0]);
};

const getNotificationsForOrganizerId = async (organizerId) => {
  const allowedNotifications = 
    await execSQL.all(`SELECT * FROM organizersNotifications WHERE organizerId = ${organizerId}`);

  const ids = allowedNotifications.map(n => n.notifyId).join();
  const notifications = 
    await execSQL.all(`SELECT * FROM notifications WHERE notifyId IN (${ids})`);

  return notifications.map(n => new Notification(n));
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      getNotification,
      getNotificationsForOrganizerId,
      getSystemAdminNotification,
    };
  }
};
