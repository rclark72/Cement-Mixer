import unittest
from cmix import app, views
from urlparse import urlparse

class MixerTestCase(unittest.TestCase):
    config_name = 'localhost'
    config_link = 'http://%s:4567' % config_name
    config_trigger = '%s' % config_link
    config_status = '%s/ping' % config_link
    def setUp(self):
        app.config['TESTING'] = True
        app.config['MONGODB_NAME'] = app.config['MONGODB_NAME'] + '_test'
        self.app = app.test_client()

    def tearDown(self):
        views.connection.drop_database(app.config['MONGODB_NAME'])

    def test_empty_db(self):
        rv = self.app.get('/')
        assert 'No build servers' in rv.data
        self.assertEqual(rv.status_code, 200)

    def test_new_server(self):
        rv = self.app.get('/server')
        self.assertEqual(rv.status_code, 200)
        assert '</form>' in rv.data

    def test_add_server(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name=self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ), follow_redirects=True)
        self.assertEqual(req_add.status_code, 200)
        req_index = self.app.get('/')
        assert self.config_name in req_index.data
        assert self.config_link in req_index.data
        assert self.config_trigger in req_index.data

    def test_update_server(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name=self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ))
        self.assertEqual(req_add.status_code, 302)
        path = urlparse(req_add.location).path
        req_change = self.app.get(path)
        self.assertEqual(req_change.status_code, 200)
        req_update = self.app.put(path, data=dict(
                                link=self.config_link,
                                name='%s_test' % self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ), follow_redirects=True)
        self.assertEqual(req_update.status_code, 200)
        req_index = self.app.get('/')
        assert '%s_test' % self.config_name in req_index.data

    def test_add_multiple_servers(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name='%s1' % self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ), follow_redirects=True)
        self.assertEqual(req_add.status_code, 200)
        req_add2 = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name='%s2' % self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ), follow_redirects=True)
        self.assertEqual(req_add2.status_code, 200)
        req_index = self.app.get('/')
        assert '%s1' % self.config_name in req_index.data
        assert '%s2' % self.config_name in req_index.data


    def test_duplicate_server(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name='%s' % self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ), follow_redirects=True)
        self.assertEqual(req_add.status_code, 200)
        req_add2 = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name='%s' % self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ), follow_redirects=True)
        self.assertEqual(req_add2.status_code, 200)
        req_index = self.app.get('/')
        assert self.config_name in req_index.data

    def test_trigger(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.config_link,
                                name=self.config_name,
                                trigger_url=self.config_trigger,
                                status_url=self.config_status
                            ))
        self.assertEqual(req_add.status_code, 302)
        path = urlparse(req_add.location).path

        req_trigger = self.app.post('%s/trigger' % path, data=dict())
        self.assertEqual(req_trigger.status_code, 200)

if __name__ == '__main__':
    unittest.main()
