from flask import Flask, render_template, request
from flask import abort, redirect, url_for, flash, session
import models
from mongokit import Connection
from pymongo import json_util
from pymongo.objectid import ObjectId
from datetime import datetime
import json
from json_encoder import MongoEncoder
app = Flask(__name__)
app.config.from_object('cmix.settings')

connection = Connection(app.config['MONGODB_HOST'],
                        int(app.config['MONGODB_PORT']))


def conn():
    return connection[app.config['MONGODB_NAME']]

models.register_connection(connection)


@app.route('/')
def index():
    return render_template('index.html', servers_json=index_json())


@app.route('/json')
def index_json():
    servers = list(conn().buildservers.find())
    servers_json = json.dumps(servers, cls=MongoEncoder)
    return servers_json
    

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
    return json.dumps(server, cls=MongoEncoder)


@app.route('/server/<server_id>', methods=['POST', 'GET', 'DELETE'])
def update_server(server_id):
    if request.method == 'POST':
        conn().buildservers.update({'_id': ObjectId(server_id)},
                {'$set': {
                    'link': request.form['link'],
                    'name': request.form['name'],
                    'trigger_url': request.form['trigger_url'],
                    'status_url': request.form['status_url'],
                    'entity_url': request.path}
                })
        flash("Server has sucessfully been updated", 'success')
        server = conn().buildservers.find_one({'_id': ObjectId(server_id)})
        return redirect(url_for('update_server', server_id=str(server['_id'])))
    elif request.method == 'DELETE':
        server = conn().buildservers.remove({'_id': ObjectId(server_id)})
        return "Success"

    server = conn().buildservers.find_one({'_id': ObjectId(server_id)})
    return render_template('update.html',
                            server=server,
                            server_id=server_id,
                            servers_json=index_json(),)


@app.route('/monitoring', methods=['POST', 'GET'])
def set_monitoring():
    if request.method == 'POST':
        active = request.form['active']
        if active == 'false':
            session['monitoring_active'] = False
        else:
            session['monitoring_active'] = True
    return str(session['monitoring_active'])


@app.route('/server/<server_id>/trigger', methods=['POST'])
def trigger_build(server_id):
    import urllib2
    server = conn().buildservers.find_one({'_id': ObjectId(server_id)})
    req = urllib2.Request(server['trigger_url'], "rebuild=true")
    try:
        response = urllib2.urlopen(req)
    except urllib2.URLError:
        return abort(503)

    if response.code != 200:
        return abort(503)

    flash("Build successfully triggered", 'success')
    return 'Build Triggered'
