from cmix.runner import sched
import time
if __name__ == '__main__':
    sched.start()
    while True:
        time.sleep(10)
