from mongokit import Connection, Document
import datetime

def register_connection(connection):
    connection.register([BuildServer])


def max_length(length):
    def validate(value):
        if len(value) <= length:
            return True
        raise Exception('%s must be at most %s characters long' % length)
    return validate


class BuildServer(Document):
    structure = {
        'link': unicode,
        'name': unicode,
        'trigger_url': unicode,
        'status_url': unicode,
        'build_success': bool,
        'last_run': datetime.datetime,
    }
    validators = {
        'name': max_length(50)
    }
    use_dot_notation = True

    def __repr__(self):
        return '<BuildServer %r>' % (self.name)
