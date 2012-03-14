$(function() {
    window.Server = Backbone.Model.extend({
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
            entity_url: '',
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
                    ServerList.fetch();
                }
            });
        },
    });

    window.ServerList = new (Backbone.Collection.extend({
        model: Server,
        url: '/json',
        initialize: function() {
            this.removeServer = function(_id) {
                return ServerList.find(function(e) { return e.attributes._id === _id }).remove();
            };
        },
    }));

    window.ListView = Backbone.View.extend({
        template: _.template( $('#serverlist_template').html()),

        initialize: function() {
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


    window.ServerDetailView = Backbone.View.extend({
        template: _.template( $('#serverdetail_template').html()),
        new_template: _.template( $('#servernew_template').html()),
        initialize: function() {
            ServerList.fetch();
            ServerList.bind('reset', this.render, this);
        },
        render: function() {
            var serverId = this.options.activeServer;
            var activeServer = ServerList.find(function(x){return x.attributes._id === serverId});
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
    window.IndexView = Backbone.View.extend({
        initialize: function() {
            ServerList.fetch();
            ServerList.bind('add', this.addOne, this);
            ServerList.bind('reset', this.addAll, this);
        },
        addOne: function(server) {
            var view = new ListView({ model: server });
            $('#content').append(view.render().el);
        },
        addAll: function() {
            $('#content').empty();
            ServerList.each(this.addOne);
        }
    });
    
    /**
     * This handles the uptime charts
     **/

    window.UptimeGraphView = Backbone.View.extend({
        initialize: function() {
            ServerList.bind('reset', this.render, this);
        },
        render: function() {
            var serverId = this.options.activeServer;
            var activeServer = ServerList.find(function(x){return x.attributes._id === serverId});
            console.log(serverId);
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
    //setInterval(function() {
    //    ServerList.fetch();
    //}, 10000);

    var AppRouter = Backbone.Router.extend({
        initialize: function() {
            this.route(/^\/?#?$/, 'index', this.index);
        },
        routes: {
            "server/add": "add_server",
            "server/:_id": "server", // matches http://example.com/#anything-here
        },
        add_server: function() {
            $('.placeholder').html('');
            var detail_view = new ServerDetailView({
                el: $('#content'),
            });
        },
        index: function() {
            $('.placeholder').html('');
            var index_view = new IndexView({
                el: $('#content'),
            });
        },
        server: function( _id ){
            $('.placeholder').html('');
            var detail_view = new ServerDetailView({
                el: $('#content'),
                activeServer: _id,
            });
            var uptime_graph = new UptimeGraphView({
                activeServer: _id,
            });
        },
        serverRoute: function( _id ){
            return "/server/" + _id;
        }
    });
    var app_router = new AppRouter;
    Backbone.history.start();
});
$(document).ready(function() {
    $('.action-delete').click(function(e) {
        var href = $(this).attr('href');
        $.ajax({
            url: href,
            type: 'DELETE',
            success: function(result) {
                window.location.reload(true);
            }
        });
    });

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
