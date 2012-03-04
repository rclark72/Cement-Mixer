from flask import Flask, render_template, request
import models
from mongokit import Connection 

app = Flask(__name__)
app.config.from_object('cmix.settings')

connection = Connection(app.config['MONGODB_HOST'],
                        int(app.config['MONGODB_PORT']))
def conn():
    return connection[app.config['MONGODB_NAME']]

models.register_connection(connection)

@app.route('/')
def index():
    servers = list(conn().buildservers.find())
    return render_template('index.html', servers=servers)

@app.route('/add_server', methods=['POST'])
def add_server():
    server = conn().buildservers.BuildServer()
    server['link'] = request.form['link']
    server['name'] = request.form['name']
    server['trigger_url'] = request.form['trigger_url']
    server['status_url'] = request.form['status_url']
    server.save()
    return 'Success'
