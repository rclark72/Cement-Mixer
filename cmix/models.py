from mongokit import Connection, Document

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
        'status_url': unicode
    }
    validators = {
        'name': max_length(50)
    }
    use_dot_notation = True
    def __repr__(self):
        return '<BuildServer %r>' % (self.name)

