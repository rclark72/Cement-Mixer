var monitoring_active = false;

function pingUrl(href, callback) {
    if (monitoring_active == false) {
        return;
    }
    $.ajax({
        url: href,
        type: 'POST',
        success: function(result) {
            callback(true);
        },
        error: function(results) {
            callback(false);
        }
    });
    setTimeout(function() { pingUrl(href, callback) }, 10000);
}

function updateField(id) {
    return function(status) {
        if(status) {
            $('.status-' + id).removeClass('label-important').addClass('label-success');
            $('.status-' + id).html('Success');
        } else {
            $('.status-' + id).removeClass('label-success').addClass('label-important');
            $('.status-' + id).html('Failure');
        }
    };
}

function startMonitoring() {
    var links = $('.server_link');
    for(var x = 0; x < links.length; x++) {
        link = links[x];
        var id = $(link).attr('data-serverid');
        pingUrl($(link).attr('href') + '/ping', updateField(id));
    }
}

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
    monitoring_active = $('#monitoring .btn-success').hasClass('active');
    startMonitoring();
    $('#monitoring .btn-success').click(function(e) {
        $.ajax({
            url: '/monitoring',
            type: 'POST',
            data: 'active=true'
        });
        monitoring_active = true;
        startMonitoring();
    });
    $('#monitoring .btn-danger').click(function(e) {
        $.ajax({
            url: '/monitoring',
            type: 'POST',
            data: 'active=false'
        });
        monitoring_active = false;
    });
});
