from mongokit import Connection, Document
import datetime


def register_connection(connection):
    connection.register([BuildServer])


class BuildServer(Document):
    structure = {
        'link': unicode,
        'name': unicode,
        'trigger_url': unicode,
        'status_url': unicode,
        'entity_url': unicode,
        'build_success': bool,
        'last_run': int,
        'changes': dict,
    }
    use_dot_notation = True
