from apscheduler.scheduler import Scheduler
import time
import urllib2
from views import conn
from datetime import datetime

sched = Scheduler()


@sched.interval_schedule(seconds=10)
def update_builds():
    servers = list(conn().buildservers.find())
    for server in servers:
        req = urllib2.Request(server['status_url'])
        success = True
        try:
            response = urllib2.urlopen(req)
            if(response.code != 200):
                success = False
        except:
            success = False

        if 'changes' in server:
            changes = server['changes']

        string_date = datetime.now().strftime("%Y-%m-%d")

        if success:
            if string_date in changes:
                changes[string_date][0] += 1
            else:
                changes[string_date] = [1, 0]

            conn().buildservers.update({'_id': server['_id']},
                    {'$set': {
                        'build_success': True,
                        'last_run': datetime.now(),
                        'changes': changes,
                        }
                    })
        else:
            if string_date in changes:
                changes[string_date][1] += 1
            else:
                changes[string_date] = [0, 1]

            conn().buildservers.update({'_id': server['_id']},
                    {'$set': {
                        'build_success': False,
                        'last_run': datetime.now(),
                        'changes': changes,
                        }
                    })
