from flask import Flask
from models import MixerConnection
app = Flask(__name__)
app.config.from_object('settings')

connection = MixerConnection(app.config['MONGODB_HOST'], app.config['MONGODB_PORT'], 'cmix')


@app.route('/')
def hello_world():
    return 'Hello World!'

if __name__ == '__main__':
    app.run()
