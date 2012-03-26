window.CM = {};

CM.Server = Backbone.Model.extend({
    validate: function( attributes ){
        if( attributes._id && attributes._id === '' ){
            return "Server needs an id";
        }
    },
    defaults: {
        link: '',
        name: '',
        trigger_url: '',
        status_url: '',
        build_success: false,
        last_run: '',
        _id: '',
        changes: []
    },
    initialize: function() {
        this.bind("error", function(model, error) {
            alert( error );
        });
    },
    remove: function() {
        $.ajax({
            url: app_router.serverRoute(this.attributes._id),
            type: 'DELETE',
            complete: function() {
                CM.servers.fetch();
            }
        });
    },
    methodUrl:  function(method){
        if(method == "delete") {
            return "servers/" + this.attributes._id;
        } else if (method == "update") {
            return "servers/" + this.attributes._id;
        } else if (method == "create") {
            return "servers/";
        } else if (method == "read") {
            return "servers/" + this.attributes._id;
        }
        return false;
    }
});

CM.ListView = Backbone.View.extend({

    initialize: function() {
        this.template = _.template( $('#serverlist_template').html()),
        this.model.bind('change', this.render, this);
        this.model.bind('destroy', this.remove, this);
    },
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },
    remove: function() {
        $(this.el).remove();
    }
});


CM.ServerDetailView = Backbone.View.extend({
    events: { "submit #newServer" : "handleNewServer" },
    handleNewServer: function(data) {
        $.ajax({
            url: app_router.addServerRoute(),
            type: 'POST',
            data: $('#newServer').serialize(),
            success: function( data ) {
                var json_data = $.parseJSON(data);
                app_router.navigate(app_router.serverRoute(json_data['_id']), {trigger: true});
            },
            error: function() {
                alert("Failed to add server");
            }
        });
        return false;
    },
    initialize: function() {
        this.template = _.template( $('#serverdetail_template').html()),
        this.new_template = _.template( $('#servernew_template').html()),
        CM.servers.fetch();
        CM.servers.bind('reset', this.render, this);
    },
    render: function() {
        var serverId = this.options.activeServer;
        var activeServer = CM.servers.find(function(x){return x.attributes._id === serverId});
        if(activeServer) {
            $('#content').html(this.template(activeServer.toJSON()));
        } else {
            $('#content').html(this.new_template());
        }
        return this;
    },
    remove: function() {
        $(this.el).remove();
    }

});

CM.IndexView = Backbone.View.extend({
    events: {"click .action-remove": 'deleteServer'},
    deleteServer: function(ev) {
        var serverId = $(ev.target).closest('div.row').attr('data-id');
        CM.servers.removeServer(serverId);
    },
    initialize: function() {
        CM.servers.fetch();
        CM.servers.bind('add', this.addOne, this);
        CM.servers.bind('reset', this.addAll, this);
    },
    addOne: function(server) {
        var view = new CM.ListView({ model: server });
        $('#content').append(view.render().el);
    },
    addAll: function() {
        $('#content').empty();
        CM.servers.each(this.addOne);
    }
});

/**
 * This handles the uptime charts
 **/
CM.UptimeGraphView = Backbone.View.extend({
    initialize: function() {
        CM.servers.bind('reset', this.render, this);
    },
    render: function() {
        var serverId = this.options.activeServer;
        var activeServer = CM.servers.find(function(x){return x.attributes._id === serverId});
        if(this.chart)
            this.chart.clearChart();
        this.chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Day');
        data.addColumn('number', 'Ratio');
        var changes = activeServer.attributes.changes;
        for( var key in changes ) {
            var successCount = changes[key][0];
            var failureCount = changes[key][1];
            var ratio = successCount / (failureCount + successCount);
            data.addRow([key, ratio]);
        }
        var options = {
            title: 'Build Success Ratio'
        };
        this.chart.draw(data, options);
        return this;
    }
});

CM.AppRouter = Backbone.Router.extend({
    initialize: function() {
        this.route(/^\/?#?$/, 'index', this.index);
    },
    routes: {
        "server/add": "add_server",
        "server/:_id": "server",
    },
    add_server: function() {
        //$('.placeholder').clear();
        var detail_view = new CM.ServerDetailView({
            el: $('#content'),
        });
    },
    index: function() {
        //$('.placeholder').empty();
        var index_view = new CM.IndexView({
            el: $('#content'),
        });
    },
    server: function( _id ){
        //$('.placeholder').clear();
        var detail_view = new CM.ServerDetailView({
            el: $('#content'),
            activeServer: _id,
        });
        var uptime_graph = new CM.UptimeGraphView({
            activeServer: _id,
        });
    },
    addServerRoute: function() {
        return "server";
    },
    serverRoute: function( _id ){
        return "/server/" + _id;
    }
});

CM.ServerList = Backbone.Collection.extend({
    model: CM.Server,
    url: '/json',
    initialize: function() {
        this.removeServer = function(_id) {
            return CM.servers.find(function(e) { return e.attributes._id === _id }).remove();
        };
    },
    methodUrl:  function(method){
        if(method == "read") {
            return "/json";
        }
        return false;
    }
});

$(function() {
    CM.servers = new CM.ServerList;
    CM.router = new CM.AppRouter;
    Backbone.history.start();
    for (var x = 1; x < 99999999999; x = x + 10) {
        Backbone.Collection.sync('read', CM.ServerList);
        sleep(10);
    }
});


$(document).ready(function() {

    $('.action-trigger').click(function(e) {
        var href = $(this).attr('href');
        $.ajax({
            url: href,
            type: 'POST',
            success: function(result) {
                window.location.reload(true);
            },
            error: function(results) {
                alert("Failed to trigger a build");
            }
        });
    });
    $('#monitoring .btn-success').click(function(e) {
        $.ajax({
            url: '/monitoring',
            type: 'POST',
            data: 'active=true'
        });
    });
    $('#monitoring .btn-danger').click(function(e) {
        $.ajax({
            url: '/monitoring',
            type: 'POST',
            data: 'active=false'
        });
    });
});
