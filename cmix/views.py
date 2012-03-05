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


@app.route('/server', methods=['POST', 'GET'])
def add_server():
    if request.method == 'GET':
        return render_template('new_server.html')
    server = conn().buildservers.BuildServer()
    server['link'] = request.form['link']
    server['name'] = request.form['name']
    server['trigger_url'] = request.form['trigger_url']
    server['status_url'] = request.form['status_url']
    server.save()
    return redirect(url_for('update_server', server_id=str(server['_id'])))


@app.route('/server/<server_id>', methods=['PUT', 'GET', 'DELETE'])
def update_server(server_id):
    if request.method == 'PUT':
        conn().buildservers.update({'_id': ObjectId(server_id)},
                {'$set': {
                    'link': request.form['link'],
                    'name': request.form['name'],
                    'trigger_url': request.form['trigger_url'],
                    'status_url': request.form['status_url']}
                })
    elif request.method == 'DELETE':
        server = conn().buildservers.remove({'_id': ObjectId(server_id)})
        return "Success"

    server = conn().buildservers.find_one({'_id': ObjectId(server_id)})

    return 'Update'


@app.route('/server/<server_id>/trigger', methods=['POST'])
def trigger_build(server_id):
    import urllib2
    server = conn().buildservers.find_one({'_id': ObjectId(server_id)})
    req = urllib2.Request(server['trigger_url'], dict())
    try:
        response = urllib2.urlopen(req)
    except urllib2.URLError:
        return abort(503)

    if response.code != 200:
        return abort(503)

    return 'Build Triggered'
