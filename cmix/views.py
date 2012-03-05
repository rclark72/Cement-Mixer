from flask import Flask, render_template, request, abort, redirect, url_for
import models
from mongokit import Connection 
from pymongo.objectid import ObjectId
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

@app.route('/server', methods=['POST'])
def add_server():
    server = conn().buildservers.BuildServer()
    server['link'] = request.form['link']
    server['name'] = request.form['name']
    server['trigger_url'] = request.form['trigger_url']
    server['status_url'] = request.form['status_url']
    server.save()
    return redirect(url_for('update_server', server_id=str(server['_id'])))

@app.route('/server/<server_id>', methods=['PUT', 'GET'])
def update_server(server_id):
    if request.method == 'PUT':
        conn().buildservers.update({'_id': ObjectId(server_id)},
                {'$set': {
                    'link': request.form['link'],
                    'name': request.form['name'],
                    'trigger_url': request.form['trigger_url'],
                    'status_url': request.form['status_url']}
                })
    server = conn().buildservers.find_one({'_id': ObjectId(server_id)})

    return 'Update'
