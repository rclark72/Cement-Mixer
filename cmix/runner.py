from apscheduler.scheduler import Scheduler
import time
import urllib2
from views import conn
from datetime import datetime
import logging
logging.basicConfig(filename='scheduler.log',level=logging.DEBUG)

sched = Scheduler()
@sched.interval_schedule(seconds=2)
def update_builds():
    servers = list(conn().buildservers.find())
    for server in servers:
        req = urllib2.Request(server['status_url'])
        try:
            response = urllib2.urlopen(req)
        except urllib2.URLError:
            conn().buildservers.update({'_id': server['_id']},
                    {'$set': {
                        'build_success': False,
                        'last_run': datetime.now()}
                    })
        else:
            if(response.code == 200):
                conn().buildservers.update({'_id': server['_id']},
                        {'$set': {
                            'build_success': True,
                            'last_run': datetime.now()}
                        })
            else:
                conn().buildservers.update({'_id': server['_id']},
                        {'$set': {
                            'build_success': False,
                            'last_run': datetime.now()}
                        })

