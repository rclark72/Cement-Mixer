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
    });

    window.ServerList = new (Backbone.Collection.extend({
        model: Server,
        url: '/json',
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
            ServerList.bind('reset', this.addServer, this);
            ServerList.bind('update', this.addServer, this);
            ServerList.fetch();
        },
        addServer: function() {
            var server_id = this.options.server_id;
            this.server = ServerList.find(function(e) { return e.attributes._id === server_id });
            this.render();
        },
        render: function() {
            $('#server_detail').html(this.template(this.server.toJSON()));
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
            setInterval(function() {
                ServerList.fetch();
            }, 10000);
            ServerList.fetch();
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
    window.UptimeStatus = Backbone.Model.extend({
        defaults: {
            _id: '',
            value: '',
        },
        initialize: function() {}
    });
    window.UptimeList = new (Backbone.Collection.extend({
        model: UptimeStatus,
        url: function() {
            return '/server/' + window.server_id + '/graph';
        }
    }));

    window.UptimeGraphView = Backbone.View.extend({
        initialize: function() {
            UptimeList.bind('reset', this.render, this);
            UptimeList.fetch();
            setInterval(function() {
                UptimeList.fetch();
            }, 60000);
        },
        render: function() {
            if(this.chart)
                this.chart.clearChart();
            this.chart = new google.visualization.LineChart(document.getElementById('chart_div'));
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Day');
            data.addColumn('number', 'Ratio');
            UptimeList.each(function(e) {
                data.addRow([e.attributes._id, e.attributes.value]);
            });
            var options = {
                title: 'Build Success Ratio'
            };
            this.chart.draw(data, options);
            return this;
        }
    });


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
