#!/bin/bash
### BEGIN INIT INFO
# Provides:          basketmsk2
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Basket backend server
### END INIT INFO

#write to -> /etc/init.d/basketmsk 

start() {
	echo 'Starting service'
	LOGFILE=/var/log/basketmsk.err.log
	cd /opt/basketmsk/

	while [[ 1 ]]; do
		BASKET_MODE=prod /usr/local/bin/node /opt/basketmsk/server.js 2>> $LOGFILE 1>&2 
		sleep 5
	done
}

notimpl() {
       echo "not implemented"
}

### main logic ###
case "$1" in
  start)
        start &
        ;;
  stop)
        notimpl
        ;;
  status)
        ;;
  restart|reload|condrestart)
        notimpl
        ;;
  *)
        echo $"Usage: $0 {start|stop|restart|reload|status}"
        exit 1
esac
exit 0
