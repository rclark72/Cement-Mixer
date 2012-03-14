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
                url: this.attributes.entity_url,
                type: 'DELETE',
                success: function(result) {
                    window.ServerList.remove(this);
                }
            });
        },
    });

    window.ServerList = new (Backbone.Collection.extend({
        model: Server,
        url: '/json',
        activeServer: function() {
            return ServerList.find(function(e) { return e.attributes.entity_url === window.location.pathname });
        },
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
        initialize: function() {
            this.render();
        },
        render: function() {
            $('#server_detail').html(this.template(ServerList.activeServer().toJSON()));
            return this;
        },
        remove: function() {
            $(this.el).remove();
        }

    });
    window.IndexView = Backbone.View.extend({
        initialize: function() {
            ServerList.bind('add', this.addOne, this);
            ServerList.bind('reset', this.addAll, this);
        },
        addOne: function(server) {
            var view = new ListView({ model: server });
            $('#index_content').append(view.render().el);
        },
        addAll: function() {
            $('#index_content').empty();
            ServerList.each(this.addOne);
        }
    });
    
    /**
     * This handles the uptime charts
     **/

    window.UptimeGraphView = Backbone.View.extend({
        initialize: function() {
            this.render();
            ServerList.bind('reset', this.render, this);
        },
        render: function() {
            var activeServer = ServerList.activeServer();
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
    setInterval(function() {
        ServerList.fetch();
    }, 10000);


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
