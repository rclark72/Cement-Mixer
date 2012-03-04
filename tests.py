import unittest
from cmix import app, views


class MixerTestCase(unittest.TestCase):
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
        req_add = self.app.post('/add_server', data=dict(
            link='http://localhost:4567',
            name='localhost',
            trigger_url='http://localhost:4567',
            status_url='http://localhost:4567/ping'
            ), follow_redirects=True)
        assert 'Success' in req_add.data
        req_index = self.app.get('/')
        assert 'localhost' in req_index.data


if __name__ == '__main__':
    unittest.main()
