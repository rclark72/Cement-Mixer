import unittest
from cmix import app, views
from urlparse import urlparse

class MixerTestCase(unittest.TestCase):
    test_name = 'localhost'
    test_link = 'http://%s:4567' % test_name
    test_trigger = '%s' % test_link
    test_status = '%s/ping' % test_link
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

    def test_add_server(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.test_link,
                                name=self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ), follow_redirects=True)
        self.assertEqual(req_add.status_code, 200)
        req_index = self.app.get('/')
        assert self.test_name in req_index.data
        assert self.test_link in req_index.data
        assert self.test_trigger in req_index.data

    def test_update_server(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.test_link,
                                name=self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ))
        self.assertEqual(req_add.status_code, 302)
        path = urlparse(req_add.location).path
        req_change = self.app.get(path)
        self.assertEqual(req_change.status_code, 200)
        req_update = self.app.put(path, data=dict(
                                link=self.test_link,
                                name='%s_test' % self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ), follow_redirects=True)
        self.assertEqual(req_update.status_code, 200)
        req_index = self.app.get('/')
        assert '%s_test' % self.test_name in req_index.data

    def test_add_multiple_servers(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.test_link,
                                name='%s1' % self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ), follow_redirects=True)
        self.assertEqual(req_add.status_code, 200)
        req_add2 = self.app.post('/server', data=dict(
                                link=self.test_link,
                                name='%s2' % self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ), follow_redirects=True)
        self.assertEqual(req_add2.status_code, 200)
        req_index = self.app.get('/')
        assert '%s1' % self.test_name in req_index.data
        assert '%s2' % self.test_name in req_index.data


    def test_duplicate_server(self):
        req_add = self.app.post('/server', data=dict(
                                link=self.test_link,
                                name='%s' % self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ), follow_redirects=True)
        self.assertEqual(req_add.status_code, 200)
        req_add2 = self.app.post('/server', data=dict(
                                link=self.test_link,
                                name='%s' % self.test_name,
                                trigger_url=self.test_trigger,
                                status_url=self.test_status
                            ), follow_redirects=True)
        self.assertEqual(req_add2.status_code, 200)
        req_index = self.app.get('/')
        assert self.test_name in req_index.data


if __name__ == '__main__':
    unittest.main()
