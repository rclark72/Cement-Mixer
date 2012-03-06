from cmix.views import app
from cmix.runner import sched

if __name__ == '__main__':
    sched.start()
    app.run()
