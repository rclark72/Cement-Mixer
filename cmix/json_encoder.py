from json import JSONEncoder
from pymongo.objectid import ObjectId

class MongoEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        else:
            return JSONEncoder.default(o)
